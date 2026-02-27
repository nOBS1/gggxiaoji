// ==================== 游戏路由（优化版）====================
// 使用并行查询和数据库事务优化性能和数据一致性

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { isValidRarity, isValidUpgradeKey, type Rarity, type UpgradeKey } from '../utils/helpers';
import { getSupabase } from '../lib/supabase';
import {
  fetchUserGameData,
  fetchUserBasicData,
  callRPC,
  withPerformanceLog,
} from '../utils/database';
import {
  getClickPower,
  rollEgg,
  calculateSellValue,
  calculateUpgradeCost,
  isTaskCompleted,
  getTaskReward,
  GAME_CONFIG,
} from '../utils/gameLogic';

const game = new Hono<{ Bindings: Env }>();
const MARKET_ONLY_RARITIES: readonly Rarity[] = ['purple', 'black'];

// ==================== GET /api/game/state ====================
// 获取用户游戏状态（使用并行查询优化）

game.get('/state', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);

    // 使用优化的并行查询
    const gameData = await withPerformanceLog(
      () => fetchUserGameData(supabase, user.userId),
      'fetchUserGameData'
    );

    // 获取今日任务
    const todayDate = new Date().toISOString().split('T')[0];
    const { data: tasks } = await supabase
      .from('daily_tasks')
      .select('task_key, progress, claimed')
      .eq('user_id', user.userId)
      .eq('date', todayDate);

    return c.json({
      success: true,
      data: {
        profile: gameData.profile,
        inventory: gameData.inventory || [],
        upgrades: gameData.upgrades || [],
        stats: gameData.stats,
        tasks: tasks || [],
      },
    });
  } catch (error) {
    console.error('[Game State Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/click ====================
// 处理点击事件（使用数据库事务）

game.post('/click', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);

    // 1. 获取用户基础数据（轻量级查询）
    const { profile, upgradeMap } = await fetchUserBasicData(supabase, user.userId);

    if (!profile) {
      throw Errors.NOT_FOUND;
    }

    // 2. 计算点击力量
    const clickPower = getClickPower(upgradeMap.clickPower || 0);
    const newProgress = (profile.peck_progress || 0) + clickPower;

    // 3. 判断是否掉落
    let droppedRarity: string | null = null;
    if (newProgress >= 100) {
      const drop = rollEgg(
        upgradeMap.level || 1,
        upgradeMap.feed || 0,
        upgradeMap.luckyChance || 0,
        profile.black_pity_counter || 0
      );
      droppedRarity = drop.rarity;
    }

    // 4. 使用数据库事务函数处理所有更新
    const result = await callRPC(supabase, 'game_click', {
      p_user_id: user.userId,
      p_click_power: clickPower,
      p_level: upgradeMap.level || 1,
      p_feed: upgradeMap.feed || 0,
      p_lucky_chance: upgradeMap.luckyChance || 0,
      p_black_pity_counter: profile.black_pity_counter || 0,
      p_dropped_rarity: droppedRarity,
    });

    return c.json({
      success: true,
      data: {
        progress: result.progress,
        droppedEgg: result.droppedEgg,
      },
    });
  } catch (error) {
    console.error('[Game Click Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/sell ====================
// 卖出蛋（使用数据库事务）

game.post('/sell', async (c) => {
  const { rarity, quantity } = await c.req.json<{ rarity: string; quantity: number }>();
  const user = c.get('user');

  // 验证输入
  if (!rarity || !quantity || quantity <= 0) {
    throw Errors.INVALID_INPUT;
  }

  if (!isValidRarity(rarity)) {
    throw Errors.INVALID_INPUT;
  }

  const rarityValue = rarity as Rarity;
  if (MARKET_ONLY_RARITIES.includes(rarityValue)) {
    throw Errors.RARITY_MARKET_ONLY;
  }

  try {
    const supabase = getSupabase(c.env);

    // 获取 goldBonus 等级
    const { data: upgrade } = await supabase
      .from('upgrades')
      .select('level')
      .eq('user_id', user.userId)
      .eq('upgrade_key', 'goldBonus')
      .single();

    const goldBonusLevel = upgrade?.level || 0;

    // 计算金币收益
    const coinsEarned = calculateSellValue(rarityValue, quantity, goldBonusLevel);

    // 使用数据库事务函数
    const result = await callRPC(supabase, 'game_sell', {
      p_user_id: user.userId,
      p_rarity: rarity,
      p_quantity: quantity,
      p_coins_earned: coinsEarned,
    });

    return c.json({
      success: true,
      data: {
        coinsEarned: result.coinsEarned,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error('[Game Sell Error]', error);
    
    // 处理特定错误
    if (error instanceof Error && error.message.includes('Insufficient inventory')) {
      throw Errors.INVALID_INPUT;
    }
    
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/upgrade ====================
// 升级功能（使用数据库事务）

game.post('/upgrade', async (c) => {
  const { upgradeKey } = await c.req.json<{ upgradeKey: string }>();
  const user = c.get('user');

  // 验证输入
  if (!upgradeKey || !isValidUpgradeKey(upgradeKey)) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);

    // 1. 获取当前升级等级
    const { data: upgrade } = await supabase
      .from('upgrades')
      .select('level')
      .eq('user_id', user.userId)
      .eq('upgrade_key', upgradeKey)
      .single();

    const currentLevel = upgrade?.level || 0;
    const config = GAME_CONFIG.UPGRADES[upgradeKey as UpgradeKey];

    // 检查是否达到最高等级
    if (currentLevel >= config.maxLevel) {
      throw Errors.INVALID_INPUT;
    }

    // 2. 计算升级成本
    const cost = calculateUpgradeCost(upgradeKey as UpgradeKey, currentLevel);

    let result;

    // 3. 根据升级类型调用不同的 RPC 函数
    if (typeof cost === 'number') {
      // 金币升级
      result = await callRPC(supabase, 'game_upgrade_coins', {
        p_user_id: user.userId,
        p_upgrade_key: upgradeKey,
        p_cost_coins: cost,
      });
    } else {
      // 蛋升级
      result = await callRPC(supabase, 'game_upgrade_eggs', {
        p_user_id: user.userId,
        p_upgrade_key: upgradeKey,
        p_costs: cost, // PostgreSQL 会自动转换为 JSONB
      });
    }

    return c.json({
      success: true,
      data: {
        upgradeKey: result.upgradeKey,
        newLevel: result.newLevel,
      },
    });
  } catch (error) {
    console.error('[Game Upgrade Error]', error);
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message.includes('Insufficient coins') || 
          error.message.includes('Insufficient') && error.message.includes('eggs')) {
        throw Errors.INVALID_INPUT;
      }
    }
    
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/claim-task ====================
// 领取每日任务奖励（使用数据库事务）

game.post('/claim-task', async (c) => {
  const { taskKey } = await c.req.json<{ taskKey: string }>();
  const user = c.get('user');

  // 验证输入
  if (!taskKey) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    const todayDate = new Date().toISOString().split('T')[0];

    // 获取任务奖励金额
    const reward = getTaskReward(taskKey);
    
    if (!reward) {
      throw Errors.INVALID_INPUT;
    }

    // 使用数据库事务函数
    const result = await callRPC(supabase, 'game_claim_task', {
      p_user_id: user.userId,
      p_task_key: taskKey,
      p_task_date: todayDate,
      p_reward: reward,
    });

    return c.json({
      success: true,
      data: {
        taskKey: result.taskKey,
        reward: result.reward,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error('[Game Claim Task Error]', error);
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message.includes('Task not found')) {
        throw Errors.NOT_FOUND;
      }
      if (error.message.includes('Task already claimed')) {
        throw Errors.INVALID_INPUT;
      }
    }
    
    throw Errors.DATABASE_ERROR;
  }
});

export default game;
