// ==================== 游戏路由 ====================
// 核心游戏逻辑：点击、获取状态、升级、卖出等

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { isValidRarity, isValidUpgradeKey, type Rarity, type UpgradeKey } from '../utils/helpers';
import { getSupabase } from '../lib/supabase';

const game = new Hono<{ Bindings: Env }>();

// ==================== GET /api/game/state ====================
// 获取用户游戏状态（库存、金币、升级等）

game.get('/state', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);

    // 获取用户资料（金币、设置等）
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    // 获取库存
    const { data: inventory } = await supabase
      .from('inventory')
      .select('rarity, quantity')
      .eq('user_id', user.userId);

    // 获取升级
    const { data: upgrades } = await supabase
      .from('upgrades')
      .select('upgrade_key, level')
      .eq('user_id', user.userId);

    // 获取游戏统计
    const { data: stats } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    // 获取今日任务进度
    const todayDate = new Date().toISOString().split('T')[0];
    const { data: tasks } = await supabase
      .from('daily_tasks')
      .select('task_key, progress, claimed')
      .eq('user_id', user.userId)
      .eq('date', todayDate);

    return c.json({
      success: true,
      data: {
        profile,
        inventory: inventory || [],
        upgrades: upgrades || [],
        stats,
        tasks: tasks || [],
      },
    });
  } catch (error) {
    console.error('[Game State Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/click ====================
// 处理点击事件，更新进度，可能掉落蛋

game.post('/click', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. 获取用户的升级信息和配置文件
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    const { data: upgrades } = await supabase
      .from('upgrades')
      .select('upgrade_key, level')
      .eq('user_id', user.userId);

    if (!profile || !upgrades) {
      throw Errors.NOT_FOUND;
    }

    // 转换升级数据为对象
    const upgradeMap: Record<string, number> = {};
    upgrades.forEach((u) => {
      upgradeMap[u.upgrade_key] = u.level;
    });

    // 2. 计算点击力量并更新进度
    const { getClickPower, rollEgg, safeAdd } = await import('../utils/gameLogic');
    const clickPower = getClickPower(upgradeMap.clickPower || 0);
    const newProgress = (profile.peck_progress || 0) + clickPower;

    let droppedEgg: string | null = null;

    // 3. 如果进度达到100，触发掉落逻辑
    if (newProgress >= 100) {
      const drop = rollEgg(
        upgradeMap.level || 1,
        upgradeMap.feed || 0,
        upgradeMap.luckyChance || 0,
        profile.black_pity_counter || 0
      );

      droppedEgg = drop.rarity;

      // 更新库存
      const { data: existingItem } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.userId)
        .eq('rarity', droppedEgg)
        .single();

      if (existingItem) {
        await supabase
          .from('inventory')
          .update({ quantity: safeAdd(existingItem.quantity, 1) })
          .eq('user_id', user.userId)
          .eq('rarity', droppedEgg);
      } else {
        await supabase
          .from('inventory')
          .insert({ user_id: user.userId, rarity: droppedEgg, quantity: 1 });
      }

      // 4. 更新配置文件和统计数据
      await supabase
        .from('profiles')
        .update({
          peck_progress: newProgress - 100,
          black_pity_counter: drop.newPityCounter,
        })
        .eq('user_id', user.userId);

      // 更新统计
      const { data: stats } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.userId)
        .single();

      if (stats) {
        await supabase
          .from('stats')
          .update({
            total_clicks: safeAdd(stats.total_clicks, 1),
          })
          .eq('user_id', user.userId);
      }
    } else {
      // 仅更新进度
      await supabase
        .from('profiles')
        .update({ peck_progress: newProgress })
        .eq('user_id', user.userId);

      // 更新统计
      const { data: stats } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.userId)
        .single();

      if (stats) {
        await supabase
          .from('stats')
          .update({
            total_clicks: safeAdd(stats.total_clicks, 1),
          })
          .eq('user_id', user.userId);
      }
    }

    // 5. 更新每日任务进度
    const { data: task } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.userId)
      .eq('task_key', 'daily_click')
      .eq('date', todayDate)
      .single();

    if (task) {
      await supabase
        .from('daily_tasks')
        .update({ progress: Math.min(task.progress + 1, 100) })
        .eq('user_id', user.userId)
        .eq('task_key', 'daily_click')
        .eq('date', todayDate);
    } else {
      await supabase
        .from('daily_tasks')
        .insert({
          user_id: user.userId,
          task_key: 'daily_click',
          date: todayDate,
          progress: 1,
          claimed: false,
        });
    }

    return c.json({
      success: true,
      data: {
        progress: newProgress >= 100 ? newProgress - 100 : newProgress,
        droppedEgg,
      },
    });
  } catch (error) {
    console.error('[Game Click Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/sell ====================
// 卖出蛋，获得金币

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

  try {
    const supabase = getSupabase(c.env);
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. 检查库存是否足够
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.userId)
      .eq('rarity', rarity)
      .single();

    if (!inventory || inventory.quantity < quantity) {
      throw Errors.INVALID_INPUT; // 库存不足
    }

    // 2. 获取 goldBonus 升级等级
    const { data: upgrade } = await supabase
      .from('upgrades')
      .select('level')
      .eq('user_id', user.userId)
      .eq('upgrade_key', 'goldBonus')
      .single();

    const goldBonusLevel = upgrade?.level || 0;

    // 3. 计算金币收益
    const { calculateSellValue, safeAdd } = await import('../utils/gameLogic');
    const coinsEarned = calculateSellValue(rarity as Rarity, quantity, goldBonusLevel);

    // 4. 更新库存和金币
    await supabase
      .from('inventory')
      .update({ quantity: inventory.quantity - quantity })
      .eq('user_id', user.userId)
      .eq('rarity', rarity);

    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('user_id', user.userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ coins: safeAdd(profile.coins, coinsEarned) })
        .eq('user_id', user.userId);
    }

    // 5. 更新统计数据
    const { data: stats } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    if (stats) {
      await supabase
        .from('stats')
        .update({
          total_eggs_sold: safeAdd(stats.total_eggs_sold, quantity),
        })
        .eq('user_id', user.userId);
    }

    // 6. 更新每日任务进度（如果是银蛋）
    if (rarity === 'silver') {
      const { data: task } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.userId)
        .eq('task_key', 'daily_sell')
        .eq('date', todayDate)
        .single();

      if (task) {
        await supabase
          .from('daily_tasks')
          .update({ progress: Math.min(task.progress + quantity, 3) })
          .eq('user_id', user.userId)
          .eq('task_key', 'daily_sell')
          .eq('date', todayDate);
      } else {
        await supabase
          .from('daily_tasks')
          .insert({
            user_id: user.userId,
            task_key: 'daily_sell',
            date: todayDate,
            progress: Math.min(quantity, 3),
            claimed: false,
          });
      }
    }

    return c.json({
      success: true,
      data: {
        coinsEarned,
        newBalance: profile ? safeAdd(profile.coins, coinsEarned) : 0,
      },
    });
  } catch (error) {
    console.error('[Game Sell Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/upgrade ====================
// 升级功能

game.post('/upgrade', async (c) => {
  const { upgradeKey } = await c.req.json<{ upgradeKey: string }>();
  const user = c.get('user');

  // 验证输入
  if (!upgradeKey || !isValidUpgradeKey(upgradeKey)) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    const { calculateUpgradeCost, safeAdd, GAME_CONFIG } = await import('../utils/gameLogic');

    // 1. 获取当前升级等级
    const { data: upgrade } = await supabase
      .from('upgrades')
      .select('*')
      .eq('user_id', user.userId)
      .eq('upgrade_key', upgradeKey)
      .single();

    const currentLevel = upgrade?.level || 0;
    const config = GAME_CONFIG.UPGRADES[upgradeKey as UpgradeKey];

    // 检查是否达到最高等级
    if (currentLevel >= config.maxLevel) {
      throw Errors.INVALID_INPUT; // 已达最高等级
    }

    // 2. 计算升级所需成本
    const cost = calculateUpgradeCost(upgradeKey as UpgradeKey, currentLevel);

    // 3. 检查资源是否足够
    if (typeof cost === 'number') {
      // 金币升级
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('user_id', user.userId)
        .single();

      if (!profile || profile.coins < cost) {
        throw Errors.INVALID_INPUT; // 金币不足
      }

      // 4. 扣除金币，提升等级
      await supabase
        .from('profiles')
        .update({ coins: profile.coins - cost })
        .eq('user_id', user.userId);
    } else {
      // 蛋升级
      const { data: inventory } = await supabase
        .from('inventory')
        .select('rarity, quantity')
        .eq('user_id', user.userId);

      if (!inventory) {
        throw Errors.NOT_FOUND;
      }

      // 转换为对象方便查找
      const inventoryMap: Record<string, number> = {};
      inventory.forEach((item) => {
        inventoryMap[item.rarity] = item.quantity;
      });

      // 检查每一种蛋的数量是否足够
      for (const [rarity, amount] of Object.entries(cost)) {
        if ((inventoryMap[rarity] || 0) < amount) {
          throw Errors.INVALID_INPUT; // 资源不足
        }
      }

      // 4. 扣除蛋，提升等级
      for (const [rarity, amount] of Object.entries(cost)) {
        await supabase
          .from('inventory')
          .update({ quantity: inventoryMap[rarity] - amount })
          .eq('user_id', user.userId)
          .eq('rarity', rarity);
      }
    }

    // 5. 提升升级等级
    if (upgrade) {
      await supabase
        .from('upgrades')
        .update({ level: currentLevel + 1 })
        .eq('user_id', user.userId)
        .eq('upgrade_key', upgradeKey);
    } else {
      await supabase
        .from('upgrades')
        .insert({
          user_id: user.userId,
          upgrade_key: upgradeKey,
          level: 1,
        });
    }

    return c.json({
      success: true,
      data: {
        upgradeKey,
        newLevel: currentLevel + 1,
      },
    });
  } catch (error) {
    console.error('[Game Upgrade Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/feed ====================
// 喂食小鸡（加速挂机产出）

game.post('/feed', async (c) => {
  const user = c.get('user');

  try {
    // TODO: 实现喂食逻辑
    // 1. 检查 feed 升级等级
    // 2. 触发加速效果（临时提升 idleRate）
    // 3. 返回加速后的状态

    return c.json({
      success: true,
      data: {
        message: 'Feed logic to be implemented',
      },
    });
  } catch (error) {
    console.error('[Game Feed Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/claim-task ====================
// 领取每日任务奖励

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

    // 1. 获取任务信息
    const { data: task } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.userId)
      .eq('task_key', taskKey)
      .eq('date', todayDate)
      .single();

    if (!task) {
      throw Errors.NOT_FOUND;
    }

    if (task.claimed) {
      throw Errors.INVALID_INPUT; // 已经领取过
    }

    // 2. 验证任务是否完成
    const { isTaskCompleted, getTaskReward, safeAdd } = await import('../utils/gameLogic');

    if (!isTaskCompleted(taskKey, task.progress)) {
      throw Errors.INVALID_INPUT; // 任务未完成
    }

    // 3. 获取奖励
    const reward = getTaskReward(taskKey);

    // 4. 更新 claimed 状态
    await supabase
      .from('daily_tasks')
      .update({ claimed: true })
      .eq('user_id', user.userId)
      .eq('task_key', taskKey)
      .eq('date', todayDate);

    // 5. 发放金币奖励
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins')
      .eq('user_id', user.userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ coins: safeAdd(profile.coins, reward) })
        .eq('user_id', user.userId);
    }

    return c.json({
      success: true,
      data: {
        taskKey,
        reward,
        newBalance: profile ? safeAdd(profile.coins, reward) : 0,
      },
    });
  } catch (error) {
    console.error('[Game Claim Task Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/game/sync-local-data ====================
// 同步本地游戏数据到服务器账号（登录时调用）

game.post('/sync-local-data', async (c) => {
  const user = c.get('user');
  const { localData } = await c.req.json<{
    localData: {
      eggs?: Record<string, number>;
      coins?: number;
      upgrades?: Record<string, number>;
      stats?: {
        totalClicks?: number;
        totalEggsSold?: number;
      };
      blackPityCounter?: number;
    }
  }>();

  if (!localData) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    const { safeAdd } = await import('../utils/gameLogic');

    console.log('[Sync Local Data] User:', user.userId);
    console.log('[Sync Local Data] Local data:', localData);

    // 1. 获取用户当前的服务器数据
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins, black_pity_counter')
      .eq('user_id', user.userId)
      .single();

    const { data: serverInventory } = await supabase
      .from('inventory')
      .select('rarity, quantity')
      .eq('user_id', user.userId);

    const { data: serverUpgrades } = await supabase
      .from('upgrades')
      .select('upgrade_key, level')
      .eq('user_id', user.userId);

    const { data: serverStats } = await supabase
      .from('stats')
      .select('total_clicks, total_eggs_sold')
      .eq('user_id', user.userId)
      .single();

    // 2. 合并金币（取更大值）
    let newCoins = profile?.coins || 0;
    if (localData.coins && localData.coins > newCoins) {
      newCoins = localData.coins;
      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('user_id', user.userId);
      console.log(`[Sync] Updated coins: ${newCoins}`);
    }

    // 3. 合并库存（取更大值）
    if (localData.eggs) {
      const serverInventoryMap: Record<string, number> = {};
      serverInventory?.forEach(item => {
        serverInventoryMap[item.rarity] = item.quantity;
      });

      for (const [rarity, localQty] of Object.entries(localData.eggs)) {
        if (!isValidRarity(rarity)) continue;
        
        const serverQty = serverInventoryMap[rarity] || 0;
        const newQty = Math.max(serverQty, localQty);
        
        if (newQty > serverQty) {
          await supabase
            .from('inventory')
            .update({ quantity: newQty })
            .eq('user_id', user.userId)
            .eq('rarity', rarity);
          console.log(`[Sync] Updated ${rarity} eggs: ${newQty}`);
        }
      }
    }

    // 4. 合并升级（取更大值）
    if (localData.upgrades) {
      const serverUpgradesMap: Record<string, number> = {};
      serverUpgrades?.forEach(item => {
        serverUpgradesMap[item.upgrade_key] = item.level;
      });

      for (const [upgradeKey, localLevel] of Object.entries(localData.upgrades)) {
        if (!isValidUpgradeKey(upgradeKey)) continue;
        
        const serverLevel = serverUpgradesMap[upgradeKey] || 0;
        const newLevel = Math.max(serverLevel, localLevel);
        
        if (newLevel > serverLevel) {
          if (serverLevel === 0) {
            // 插入新记录
            await supabase
              .from('upgrades')
              .insert({
                user_id: user.userId,
                upgrade_key: upgradeKey,
                level: newLevel
              });
          } else {
            // 更新现有记录
            await supabase
              .from('upgrades')
              .update({ level: newLevel })
              .eq('user_id', user.userId)
              .eq('upgrade_key', upgradeKey);
          }
          console.log(`[Sync] Updated ${upgradeKey} level: ${newLevel}`);
        }
      }
    }

    // 5. 合并统计数据（累加）
    if (localData.stats) {
      const updates: Record<string, number> = {};
      
      if (localData.stats.totalClicks) {
        updates.total_clicks = safeAdd(
          serverStats?.total_clicks || 0,
          localData.stats.totalClicks
        );
      }
      
      if (localData.stats.totalEggsSold) {
        updates.total_eggs_sold = safeAdd(
          serverStats?.total_eggs_sold || 0,
          localData.stats.totalEggsSold
        );
      }
      
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('stats')
          .update(updates)
          .eq('user_id', user.userId);
        console.log('[Sync] Updated stats:', updates);
      }
    }

    // 6. 合并黑色保底计数（取更大值）
    if (localData.blackPityCounter !== undefined) {
      const serverPity = profile?.black_pity_counter || 0;
      const newPity = Math.max(serverPity, localData.blackPityCounter);
      
      if (newPity > serverPity) {
        await supabase
          .from('profiles')
          .update({ black_pity_counter: newPity })
          .eq('user_id', user.userId);
        console.log(`[Sync] Updated black pity counter: ${newPity}`);
      }
    }

    console.log('[Sync Local Data] Sync completed successfully');

    return c.json({
      success: true,
      data: {
        message: '本地数据已同步到服务器',
      },
    });
  } catch (error) {
    console.error('[Sync Local Data Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

export default game;
