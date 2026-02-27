// ==================== 数据库辅助函数 ====================
// 封装常用的数据库操作，提高代码复用性和性能

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 并行获取用户游戏数据
 * 使用 Promise.all 减少串行查询时间
 */
export async function fetchUserGameData(
  supabase: SupabaseClient,
  userId: string
) {
  const [
    { data: profile, error: profileError },
    { data: upgrades, error: upgradesError },
    { data: inventory, error: inventoryError },
    { data: stats, error: statsError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),
    
    supabase
      .from('upgrades')
      .select('upgrade_key, level')
      .eq('user_id', userId),
    
    supabase
      .from('inventory')
      .select('rarity, quantity')
      .eq('user_id', userId),
    
    supabase
      .from('stats')
      .select('*')
      .eq('user_id', userId)
      .single(),
  ]);

  // 检查错误
  if (profileError) throw profileError;
  if (upgradesError) throw upgradesError;
  if (inventoryError) throw inventoryError;
  if (statsError) throw statsError;

  // 转换升级数据为对象
  const upgradeMap: Record<string, number> = {};
  (upgrades || []).forEach((u) => {
    upgradeMap[u.upgrade_key] = u.level;
  });

  // 转换库存数据为对象
  const inventoryMap: Record<string, number> = {};
  (inventory || []).forEach((i) => {
    inventoryMap[i.rarity] = i.quantity;
  });

  return {
    profile,
    upgrades,
    upgradeMap,
    inventory,
    inventoryMap,
    stats,
  };
}

/**
 * 并行获取用户基础数据（轻量级）
 * 仅获取必要的数据，用于简单操作
 */
export async function fetchUserBasicData(
  supabase: SupabaseClient,
  userId: string
) {
  const [
    { data: profile, error: profileError },
    { data: upgrades, error: upgradesError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, coins, peck_progress, black_pity_counter')
      .eq('user_id', userId)
      .single(),
    
    supabase
      .from('upgrades')
      .select('upgrade_key, level')
      .eq('user_id', userId),
  ]);

  if (profileError) throw profileError;
  if (upgradesError) throw upgradesError;

  const upgradeMap: Record<string, number> = {};
  (upgrades || []).forEach((u) => {
    upgradeMap[u.upgrade_key] = u.level;
  });

  return {
    profile,
    upgradeMap,
  };
}

/**
 * 批量更新库存（使用 Promise.all 并行）
 */
export async function updateInventoryBatch(
  supabase: SupabaseClient,
  userId: string,
  updates: Array<{ rarity: string; delta: number }>
) {
  const promises = updates.map(({ rarity, delta }) =>
    supabase.rpc('update_inventory_single', {
      p_user_id: userId,
      p_rarity: rarity,
      p_delta: delta,
    })
  );

  const results = await Promise.all(promises);
  
  // 检查错误
  results.forEach((result, index) => {
    if (result.error) {
      console.error(`Failed to update ${updates[index].rarity}:`, result.error);
      throw result.error;
    }
  });

  return { success: true };
}

/**
 * 获取或创建每日任务
 * 自动处理 UPSERT 逻辑
 */
export async function upsertDailyTask(
  supabase: SupabaseClient,
  userId: string,
  taskKey: string,
  progressDelta: number,
  maxProgress: number
) {
  const todayDate = new Date().toISOString().split('T')[0];

  // 尝试获取现有任务
  const { data: existingTask } = await supabase
    .from('daily_tasks')
    .select('progress')
    .eq('user_id', userId)
    .eq('task_key', taskKey)
    .eq('date', todayDate)
    .single();

  if (existingTask) {
    // 更新现有任务
    const newProgress = Math.min(existingTask.progress + progressDelta, maxProgress);
    
    const { error } = await supabase
      .from('daily_tasks')
      .update({ progress: newProgress })
      .eq('user_id', userId)
      .eq('task_key', taskKey)
      .eq('date', todayDate);

    if (error) throw error;
    return { progress: newProgress };
  } else {
    // 创建新任务
    const { error } = await supabase
      .from('daily_tasks')
      .insert({
        user_id: userId,
        task_key: taskKey,
        date: todayDate,
        progress: Math.min(progressDelta, maxProgress),
        claimed: false,
      });

    if (error) throw error;
    return { progress: Math.min(progressDelta, maxProgress) };
  }
}

/**
 * 调用数据库 RPC 函数的辅助方法
 * 统一错误处理和日志记录
 */
export async function callRPC<T = any>(
  supabase: SupabaseClient,
  functionName: string,
  params: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  const { data, error } = await supabase.rpc(functionName, params);
  
  const duration = Date.now() - startTime;
  
  if (error) {
    console.error(`[RPC Error] ${functionName}:`, error);
    console.error(`[RPC Error] Params:`, params);
    throw error;
  }
  
  console.log(`[RPC Success] ${functionName} completed in ${duration}ms`);
  
  return data as T;
}

/**
 * 批量查询多个用户数据（用于排行榜等场景）
 */
export async function fetchMultipleUsersData(
  supabase: SupabaseClient,
  userIds: string[],
  fields: string = 'user_id, nickname, coins'
) {
  const { data, error } = await supabase
    .from('profiles')
    .select(fields)
    .in('user_id', userIds);

  if (error) throw error;

  return data || [];
}

/**
 * 检查库存是否足够
 */
export async function checkInventorySufficient(
  supabase: SupabaseClient,
  userId: string,
  requirements: Record<string, number>
): Promise<{ sufficient: boolean; missing?: Record<string, number> }> {
  const { data: inventory } = await supabase
    .from('inventory')
    .select('rarity, quantity')
    .eq('user_id', userId);

  if (!inventory) {
    return { sufficient: false, missing: requirements };
  }

  const inventoryMap: Record<string, number> = {};
  inventory.forEach((item) => {
    inventoryMap[item.rarity] = item.quantity;
  });

  const missing: Record<string, number> = {};
  let sufficient = true;

  for (const [rarity, required] of Object.entries(requirements)) {
    const available = inventoryMap[rarity] || 0;
    if (available < required) {
      sufficient = false;
      missing[rarity] = required - available;
    }
  }

  return { sufficient, missing: sufficient ? undefined : missing };
}

/**
 * 更新统计数据的辅助函数
 */
export async function incrementStats(
  supabase: SupabaseClient,
  userId: string,
  field: string,
  amount: number = 1
) {
  // 使用 PostgreSQL 的原子性更新
  const { error } = await supabase.rpc('increment_stat', {
    p_user_id: userId,
    p_field: field,
    p_amount: amount,
  });

  if (error) {
    // 如果 RPC 函数不存在，回退到普通更新
    console.warn('increment_stat RPC not found, using fallback');
    const { data: stats } = await supabase
      .from('stats')
      .select(field)
      .eq('user_id', userId)
      .single();

    if (stats) {
      const newValue = (stats[field] || 0) + amount;
      const { error: updateError } = await supabase
        .from('stats')
        .update({ [field]: newValue })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    }
  }
}

/**
 * 清理过期的每日任务
 * 应该由定时任务调用
 */
export async function cleanupExpiredTasks(
  supabase: SupabaseClient,
  daysToKeep: number = 7
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .lt('date', cutoffDateStr);

  if (error) {
    console.error('Failed to cleanup expired tasks:', error);
    throw error;
  }

  console.log(`Cleaned up tasks older than ${cutoffDateStr}`);
}

/**
 * 性能监控辅助函数
 * 记录查询时间
 */
export function withPerformanceLog<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      console.log(`[Performance] ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Performance] ${name} failed after ${duration}ms`);
      throw error;
    }
  }) as T;
}
