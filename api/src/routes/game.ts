// ==================== 娓告垙璺敱 ====================
// 鏍稿績娓告垙閫昏緫锛氱偣鍑汇€佽幏鍙栫姸鎬併€佸崌绾с€佸崠鍑虹瓑

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { isValidRarity, isValidUpgradeKey, type Rarity, type UpgradeKey } from '../utils/helpers';
import { getSupabase } from '../lib/supabase';

const game = new Hono<{ Bindings: Env }>();
const MARKET_ONLY_RARITIES: readonly Rarity[] = ['purple', 'black'];
type LocalSyncPayload = {
  eggs?: Record<string, number>;
  coins?: number;
  upgrades?: Record<string, number>;
  stats?: {
    totalClicks?: number;
    totalEggsSold?: number;
  };
  blackPityCounter?: number;
};

const hasMeaningfulLocalData = (data?: LocalSyncPayload | null): boolean => {
  if (!data) return false;
  if (typeof data.coins === 'number' && data.coins > 0) return true;
  if (typeof data.blackPityCounter === 'number' && data.blackPityCounter > 0) return true;
  if (data.eggs && Object.values(data.eggs).some((qty) => typeof qty === 'number' && qty > 0)) return true;
  if (data.upgrades && Object.values(data.upgrades).some((level) => typeof level === 'number' && level > 0)) return true;
  if (
    data.stats &&
    (
      (typeof data.stats.totalClicks === 'number' && data.stats.totalClicks > 0) ||
      (typeof data.stats.totalEggsSold === 'number' && data.stats.totalEggsSold > 0)
    )
  ) {
    return true;
  }
  return false;
};

// ==================== GET /api/game/state ====================
// 鑾峰彇鐢ㄦ埛娓告垙鐘舵€侊紙搴撳瓨銆侀噾甯併€佸崌绾х瓑锛?

game.get('/state', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);

    // 鑾峰彇鐢ㄦ埛璧勬枡锛堥噾甯併€佽缃瓑锛?
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    // 鑾峰彇搴撳瓨
    const { data: inventory } = await supabase
      .from('inventory')
      .select('rarity, quantity')
      .eq('user_id', user.userId);

    // 鑾峰彇鍗囩骇
    const { data: upgrades } = await supabase
      .from('upgrades')
      .select('upgrade_key, level')
      .eq('user_id', user.userId);

    // 鑾峰彇娓告垙缁熻
    const { data: stats } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    // 鑾峰彇浠婃棩浠诲姟杩涘害
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
// 澶勭悊鐐瑰嚮浜嬩欢锛屾洿鏂拌繘搴︼紝鍙兘鎺夎惤铔?

game.post('/click', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. 鑾峰彇鐢ㄦ埛鐨勫崌绾т俊鎭拰閰嶇疆鏂囦欢
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

    // 杞崲鍗囩骇鏁版嵁涓哄璞?
    const upgradeMap: Record<string, number> = {};
    upgrades.forEach((u) => {
      upgradeMap[u.upgrade_key] = u.level;
    });

    // 2. 璁＄畻鐐瑰嚮鍔涢噺骞舵洿鏂拌繘搴?
    const { getClickPower, rollEgg, safeAdd } = await import('../utils/gameLogic');
    const clickPower = getClickPower(upgradeMap.clickPower || 0);
    const newProgress = (profile.peck_progress || 0) + clickPower;

    let droppedEgg: string | null = null;

    // 3. 濡傛灉杩涘害杈惧埌100锛岃Е鍙戞帀钀介€昏緫
    if (newProgress >= 100) {
      const drop = rollEgg(
        upgradeMap.level || 1,
        upgradeMap.feed || 0,
        upgradeMap.luckyChance || 0,
        profile.black_pity_counter || 0
      );

      droppedEgg = drop.rarity;

      // 鏇存柊搴撳瓨
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

      // 4. 鏇存柊閰嶇疆鏂囦欢鍜岀粺璁℃暟鎹?
      await supabase
        .from('profiles')
        .update({
          peck_progress: newProgress - 100,
          black_pity_counter: drop.newPityCounter,
        })
        .eq('user_id', user.userId);

      // 鏇存柊缁熻
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
      // 浠呮洿鏂拌繘搴?
      await supabase
        .from('profiles')
        .update({ peck_progress: newProgress })
        .eq('user_id', user.userId);

      // 鏇存柊缁熻
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

    // 5. 鏇存柊姣忔棩浠诲姟杩涘害
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
// 鍗栧嚭铔嬶紝鑾峰緱閲戝竵

game.post('/sell', async (c) => {
  const { rarity, quantity } = await c.req.json<{ rarity: string; quantity: number }>();
  const user = c.get('user');

  // 楠岃瘉杈撳叆
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
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. 妫€鏌ュ簱瀛樻槸鍚﹁冻澶?
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.userId)
      .eq('rarity', rarity)
      .single();

    if (!inventory || inventory.quantity < quantity) {
      throw Errors.INVALID_INPUT; // 搴撳瓨涓嶈冻
    }

    // 2. 鑾峰彇 goldBonus 鍗囩骇绛夌骇
    const { data: upgrade } = await supabase
      .from('upgrades')
      .select('level')
      .eq('user_id', user.userId)
      .eq('upgrade_key', 'goldBonus')
      .single();

    const goldBonusLevel = upgrade?.level || 0;

    // 3. 璁＄畻閲戝竵鏀剁泭
    const { calculateSellValue, safeAdd } = await import('../utils/gameLogic');
    const coinsEarned = calculateSellValue(rarityValue, quantity, goldBonusLevel);

    // 4. 鏇存柊搴撳瓨鍜岄噾甯?
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

    // 5. 鏇存柊缁熻鏁版嵁
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

    // 6. 鏇存柊姣忔棩浠诲姟杩涘害锛堝鏋滄槸閾惰泲锛?
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
// 鍗囩骇鍔熻兘

game.post('/upgrade', async (c) => {
  const { upgradeKey } = await c.req.json<{ upgradeKey: string }>();
  const user = c.get('user');

  // 楠岃瘉杈撳叆
  if (!upgradeKey || !isValidUpgradeKey(upgradeKey)) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    const { calculateUpgradeCost, safeAdd, GAME_CONFIG } = await import('../utils/gameLogic');

    // 1. 鑾峰彇褰撳墠鍗囩骇绛夌骇
    const { data: upgrade } = await supabase
      .from('upgrades')
      .select('*')
      .eq('user_id', user.userId)
      .eq('upgrade_key', upgradeKey)
      .single();

    const currentLevel = upgrade?.level || 0;
    const config = GAME_CONFIG.UPGRADES[upgradeKey as UpgradeKey];

    // 妫€鏌ユ槸鍚﹁揪鍒版渶楂樼瓑绾?
    if (currentLevel >= config.maxLevel) {
      throw Errors.INVALID_INPUT; // 宸茶揪鏈€楂樼瓑绾?
    }

    // 2. 璁＄畻鍗囩骇鎵€闇€鎴愭湰
    const cost = calculateUpgradeCost(upgradeKey as UpgradeKey, currentLevel);

    // 3. 妫€鏌ヨ祫婧愭槸鍚﹁冻澶?
    if (typeof cost === 'number') {
      // 閲戝竵鍗囩骇
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('user_id', user.userId)
        .single();

      if (!profile || profile.coins < cost) {
        throw Errors.INVALID_INPUT; // 閲戝竵涓嶈冻
      }

      // 4. 鎵ｉ櫎閲戝竵锛屾彁鍗囩瓑绾?
      await supabase
        .from('profiles')
        .update({ coins: profile.coins - cost })
        .eq('user_id', user.userId);
    } else {
      // 铔嬪崌绾?
      const { data: inventory } = await supabase
        .from('inventory')
        .select('rarity, quantity')
        .eq('user_id', user.userId);

      if (!inventory) {
        throw Errors.NOT_FOUND;
      }

      // 杞崲涓哄璞℃柟渚挎煡鎵?
      const inventoryMap: Record<string, number> = {};
      inventory.forEach((item) => {
        inventoryMap[item.rarity] = item.quantity;
      });

      // 妫€鏌ユ瘡涓€绉嶈泲鐨勬暟閲忔槸鍚﹁冻澶?
      for (const [rarity, amount] of Object.entries(cost)) {
        if ((inventoryMap[rarity] || 0) < amount) {
          throw Errors.INVALID_INPUT; // 璧勬簮涓嶈冻
        }
      }

      // 4. 鎵ｉ櫎铔嬶紝鎻愬崌绛夌骇
      for (const [rarity, amount] of Object.entries(cost)) {
        await supabase
          .from('inventory')
          .update({ quantity: inventoryMap[rarity] - amount })
          .eq('user_id', user.userId)
          .eq('rarity', rarity);
      }
    }

    // 5. 鎻愬崌鍗囩骇绛夌骇
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
// 鍠傞灏忛浮锛堝姞閫熸寕鏈轰骇鍑猴級

game.post('/feed', async (c) => {
  const user = c.get('user');

  try {
    // TODO: 瀹炵幇鍠傞閫昏緫
    // 1. 妫€鏌?feed 鍗囩骇绛夌骇
    // 2. 瑙﹀彂鍔犻€熸晥鏋滐紙涓存椂鎻愬崌 idleRate锛?
    // 3. 杩斿洖鍔犻€熷悗鐨勭姸鎬?

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
// 棰嗗彇姣忔棩浠诲姟濂栧姳

game.post('/claim-task', async (c) => {
  const { taskKey } = await c.req.json<{ taskKey: string }>();
  const user = c.get('user');

  // 楠岃瘉杈撳叆
  if (!taskKey) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. 鑾峰彇浠诲姟淇℃伅
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
      throw Errors.INVALID_INPUT; // 宸茬粡棰嗗彇杩?
    }

    // 2. 楠岃瘉浠诲姟鏄惁瀹屾垚
    const { isTaskCompleted, getTaskReward, safeAdd } = await import('../utils/gameLogic');

    if (!isTaskCompleted(taskKey, task.progress)) {
      throw Errors.INVALID_INPUT; // 浠诲姟鏈畬鎴?
    }

    // 3. 鑾峰彇濂栧姳
    const reward = getTaskReward(taskKey);

    // 4. 鏇存柊 claimed 鐘舵€?
    await supabase
      .from('daily_tasks')
      .update({ claimed: true })
      .eq('user_id', user.userId)
      .eq('task_key', taskKey)
      .eq('date', todayDate);

    // 5. 鍙戞斁閲戝竵濂栧姳
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
// 鍚屾鏈湴娓告垙鏁版嵁鍒版湇鍔″櫒璐﹀彿锛堢櫥褰曟椂璋冪敤锛?

game.post('/sync-local-data', async (c) => {
  const user = c.get('user');
  const { localData } = await c.req.json<{ localData: LocalSyncPayload }>();

  if (!localData) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    const { safeAdd } = await import('../utils/gameLogic');

    console.log('[Sync Local Data] User:', user.userId);
    console.log('[Sync Local Data] Local data:', localData);

    const [
      { data: profile },
      { data: serverInventory },
      { data: serverUpgrades },
      { data: serverStats },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('coins, black_pity_counter')
        .eq('user_id', user.userId)
        .single(),
      supabase
        .from('inventory')
        .select('rarity, quantity')
        .eq('user_id', user.userId),
      supabase
        .from('upgrades')
        .select('upgrade_key, level')
        .eq('user_id', user.userId),
      supabase
        .from('stats')
        .select('total_clicks, total_eggs_sold')
        .eq('user_id', user.userId)
        .single(),
    ]);

    if (!hasMeaningfulLocalData(localData)) {
      console.log('[Sync Local Data] Skipped merge (no meaningful local data)');
      return c.json({
        success: true,
        data: {
          merged: false,
          profile,
          inventory: serverInventory || [],
          upgrades: serverUpgrades || [],
          stats: serverStats,
        },
      });
    }

    // Merge coins (keep the larger value)
    let newCoins = profile?.coins || 0;
    if (typeof localData.coins === 'number' && localData.coins > newCoins) {
      newCoins = localData.coins;
      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('user_id', user.userId);
      console.log(`[Sync] Updated coins: ${newCoins}`);
    }

    // Merge inventory (keep the larger quantity)
    if (localData.eggs) {
      const serverInventoryMap: Record<string, number> = {};
      serverInventory?.forEach((item) => {
        serverInventoryMap[item.rarity] = item.quantity;
      });

      for (const [rarity, localQty] of Object.entries(localData.eggs)) {
        if (!isValidRarity(rarity)) continue;

        const serverQty = serverInventoryMap[rarity] || 0;
        const newQty = Math.max(serverQty, localQty || 0);

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

    // Merge upgrades (keep the higher level)
    if (localData.upgrades) {
      const serverUpgradesMap: Record<string, number> = {};
      serverUpgrades?.forEach((item) => {
        serverUpgradesMap[item.upgrade_key] = item.level;
      });

      for (const [upgradeKey, localLevel] of Object.entries(localData.upgrades)) {
        if (!isValidUpgradeKey(upgradeKey)) continue;

        const serverLevel = serverUpgradesMap[upgradeKey] || 0;
        const newLevel = Math.max(serverLevel, localLevel || 0);

        if (newLevel > serverLevel) {
          if (serverLevel === 0) {
            await supabase
              .from('upgrades')
              .insert({
                user_id: user.userId,
                upgrade_key: upgradeKey,
                level: newLevel,
              });
          } else {
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

    // Merge stats (additive)
    if (localData.stats) {
      const updates: Record<string, number> = {};

      if (typeof localData.stats.totalClicks === 'number' && localData.stats.totalClicks > 0) {
        updates.total_clicks = safeAdd(
          serverStats?.total_clicks || 0,
          localData.stats.totalClicks
        );
      }

      if (typeof localData.stats.totalEggsSold === 'number' && localData.stats.totalEggsSold > 0) {
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

    // Merge pity counter (keep the larger value)
    if (typeof localData.blackPityCounter === 'number') {
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

    const [
      { data: updatedProfile },
      { data: updatedInventory },
      { data: updatedUpgrades },
      { data: updatedStats },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('coins, black_pity_counter')
        .eq('user_id', user.userId)
        .single(),
      supabase
        .from('inventory')
        .select('rarity, quantity')
        .eq('user_id', user.userId),
      supabase
        .from('upgrades')
        .select('upgrade_key, level')
        .eq('user_id', user.userId),
      supabase
        .from('stats')
        .select('total_clicks, total_eggs_sold')
        .eq('user_id', user.userId)
        .single(),
    ]);

    return c.json({
      success: true,
      data: {
        merged: true,
        profile: updatedProfile,
        inventory: updatedInventory || [],
        upgrades: updatedUpgrades || [],
        stats: updatedStats,
      },
    });
  } catch (error) {
    console.error('[Sync Local Data Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

export default game;






