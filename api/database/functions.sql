-- ==================== 游戏核心业务逻辑数据库函数 ====================
-- 使用 PostgreSQL RPC 函数实现原子性事务操作
-- 这些函数确保多步骤操作的数据一致性

-- ==================== 1. 用户点击函数 ====================
-- 处理点击、掉落、库存更新、统计更新等操作

CREATE OR REPLACE FUNCTION game_click(
  p_user_id TEXT,
  p_click_power INT,
  p_level INT,
  p_feed INT,
  p_lucky_chance INT,
  p_black_pity_counter INT,
  p_dropped_rarity TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_new_progress INT;
  v_dropped BOOLEAN := FALSE;
  v_new_pity INT;
  v_result JSON;
BEGIN
  -- 获取当前进度
  SELECT peck_progress INTO v_new_progress
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- 增加进度
  v_new_progress := v_new_progress + p_click_power;
  
  -- 检查是否掉落
  IF v_new_progress >= 100 AND p_dropped_rarity IS NOT NULL THEN
    v_dropped := TRUE;
    v_new_progress := v_new_progress - 100;
    
    -- 更新保底计数器
    IF p_dropped_rarity = 'black' THEN
      v_new_pity := 0;
    ELSE
      v_new_pity := p_black_pity_counter + 1;
    END IF;
    
    -- 更新库存（使用 UPSERT）
    INSERT INTO inventory (user_id, rarity, quantity)
    VALUES (p_user_id, p_dropped_rarity, 1)
    ON CONFLICT (user_id, rarity)
    DO UPDATE SET quantity = inventory.quantity + 1;
    
    -- 更新 profile（进度和保底）
    UPDATE profiles
    SET peck_progress = v_new_progress,
        black_pity_counter = v_new_pity
    WHERE user_id = p_user_id;
  ELSE
    -- 只更新进度
    UPDATE profiles
    SET peck_progress = v_new_progress
    WHERE user_id = p_user_id;
    
    v_new_pity := p_black_pity_counter;
  END IF;
  
  -- 更新统计
  UPDATE stats
  SET total_clicks = total_clicks + 1
  WHERE user_id = p_user_id;
  
  -- 更新每日任务
  INSERT INTO daily_tasks (user_id, task_key, date, progress, claimed)
  VALUES (
    p_user_id,
    'daily_click',
    CURRENT_DATE,
    1,
    FALSE
  )
  ON CONFLICT (user_id, task_key, date)
  DO UPDATE SET progress = LEAST(daily_tasks.progress + 1, 100);
  
  -- 返回结果
  v_result := json_build_object(
    'success', TRUE,
    'progress', v_new_progress,
    'droppedEgg', p_dropped_rarity,
    'newPityCounter', v_new_pity
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ==================== 2. 卖出蛋函数 ====================
-- 处理库存扣除、金币增加、统计更新等操作

CREATE OR REPLACE FUNCTION game_sell(
  p_user_id TEXT,
  p_rarity TEXT,
  p_quantity INT,
  p_coins_earned INT
) RETURNS JSON AS $$
DECLARE
  v_current_quantity INT;
  v_new_balance INT;
  v_result JSON;
BEGIN
  -- 检查库存
  SELECT quantity INTO v_current_quantity
  FROM inventory
  WHERE user_id = p_user_id AND rarity = p_rarity;
  
  IF v_current_quantity IS NULL OR v_current_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory';
  END IF;
  
  -- 扣除库存
  UPDATE inventory
  SET quantity = quantity - p_quantity
  WHERE user_id = p_user_id AND rarity = p_rarity;
  
  -- 增加金币
  UPDATE profiles
  SET coins = coins + p_coins_earned
  WHERE user_id = p_user_id
  RETURNING coins INTO v_new_balance;
  
  -- 更新统计
  UPDATE stats
  SET total_eggs_sold = total_eggs_sold + p_quantity
  WHERE user_id = p_user_id;
  
  -- 如果是银蛋，更新每日任务
  IF p_rarity = 'silver' THEN
    INSERT INTO daily_tasks (user_id, task_key, date, progress, claimed)
    VALUES (
      p_user_id,
      'daily_sell',
      CURRENT_DATE,
      p_quantity,
      FALSE
    )
    ON CONFLICT (user_id, task_key, date)
    DO UPDATE SET progress = LEAST(daily_tasks.progress + p_quantity, 3);
  END IF;
  
  -- 返回结果
  v_result := json_build_object(
    'success', TRUE,
    'coinsEarned', p_coins_earned,
    'newBalance', v_new_balance
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ==================== 3. 升级函数（金币升级）====================
-- 处理金币扣除和等级提升

CREATE OR REPLACE FUNCTION game_upgrade_coins(
  p_user_id TEXT,
  p_upgrade_key TEXT,
  p_cost_coins INT
) RETURNS JSON AS $$
DECLARE
  v_current_level INT;
  v_new_level INT;
  v_current_coins INT;
  v_result JSON;
BEGIN
  -- 检查金币
  SELECT coins INTO v_current_coins
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF v_current_coins < p_cost_coins THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  
  -- 扣除金币
  UPDATE profiles
  SET coins = coins - p_cost_coins
  WHERE user_id = p_user_id;
  
  -- 提升等级（使用 UPSERT）
  INSERT INTO upgrades (user_id, upgrade_key, level)
  VALUES (p_user_id, p_upgrade_key, 1)
  ON CONFLICT (user_id, upgrade_key)
  DO UPDATE SET level = upgrades.level + 1
  RETURNING level INTO v_new_level;
  
  -- 返回结果
  v_result := json_build_object(
    'success', TRUE,
    'upgradeKey', p_upgrade_key,
    'newLevel', v_new_level
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ==================== 4. 升级函数（蛋升级）====================
-- 处理蛋扣除和等级提升

CREATE OR REPLACE FUNCTION game_upgrade_eggs(
  p_user_id TEXT,
  p_upgrade_key TEXT,
  p_costs JSONB  -- 格式: {"white": 10, "brown": 5}
) RETURNS JSON AS $$
DECLARE
  v_rarity TEXT;
  v_amount INT;
  v_current_quantity INT;
  v_new_level INT;
  v_result JSON;
BEGIN
  -- 检查并扣除每种蛋
  FOR v_rarity, v_amount IN
    SELECT key, value::INT
    FROM jsonb_each_text(p_costs)
  LOOP
    -- 检查库存
    SELECT quantity INTO v_current_quantity
    FROM inventory
    WHERE user_id = p_user_id AND rarity = v_rarity;
    
    IF v_current_quantity IS NULL OR v_current_quantity < v_amount THEN
      RAISE EXCEPTION 'Insufficient % eggs', v_rarity;
    END IF;
    
    -- 扣除库存
    UPDATE inventory
    SET quantity = quantity - v_amount
    WHERE user_id = p_user_id AND rarity = v_rarity;
  END LOOP;
  
  -- 提升等级（使用 UPSERT）
  INSERT INTO upgrades (user_id, upgrade_key, level)
  VALUES (p_user_id, p_upgrade_key, 1)
  ON CONFLICT (user_id, upgrade_key)
  DO UPDATE SET level = upgrades.level + 1
  RETURNING level INTO v_new_level;
  
  -- 返回结果
  v_result := json_build_object(
    'success', TRUE,
    'upgradeKey', p_upgrade_key,
    'newLevel', v_new_level
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ==================== 5. 领取任务奖励函数 ====================
-- 处理任务状态更新和金币发放

CREATE OR REPLACE FUNCTION game_claim_task(
  p_user_id TEXT,
  p_task_key TEXT,
  p_task_date DATE,
  p_reward INT
) RETURNS JSON AS $$
DECLARE
  v_task_progress INT;
  v_task_claimed BOOLEAN;
  v_new_balance INT;
  v_result JSON;
BEGIN
  -- 获取任务信息
  SELECT progress, claimed INTO v_task_progress, v_task_claimed
  FROM daily_tasks
  WHERE user_id = p_user_id 
    AND task_key = p_task_key 
    AND date = p_task_date;
  
  IF v_task_progress IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  
  IF v_task_claimed THEN
    RAISE EXCEPTION 'Task already claimed';
  END IF;
  
  -- 更新任务状态
  UPDATE daily_tasks
  SET claimed = TRUE
  WHERE user_id = p_user_id 
    AND task_key = p_task_key 
    AND date = p_task_date;
  
  -- 发放金币
  UPDATE profiles
  SET coins = coins + p_reward
  WHERE user_id = p_user_id
  RETURNING coins INTO v_new_balance;
  
  -- 返回结果
  v_result := json_build_object(
    'success', TRUE,
    'taskKey', p_task_key,
    'reward', p_reward,
    'newBalance', v_new_balance
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ==================== 6. 批量更新库存函数 ====================
-- 用于同时更新多个稀有度的库存

CREATE OR REPLACE FUNCTION update_inventory_batch(
  p_user_id TEXT,
  p_updates JSONB  -- 格式: [{"rarity": "white", "delta": -10}, ...]
) RETURNS JSON AS $$
DECLARE
  v_update JSONB;
  v_rarity TEXT;
  v_delta INT;
  v_result JSON;
BEGIN
  -- 遍历更新列表
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    v_rarity := v_update->>'rarity';
    v_delta := (v_update->>'delta')::INT;
    
    -- 更新库存
    UPDATE inventory
    SET quantity = quantity + v_delta
    WHERE user_id = p_user_id AND rarity = v_rarity;
    
    -- 如果记录不存在且 delta 为正，插入新记录
    IF NOT FOUND AND v_delta > 0 THEN
      INSERT INTO inventory (user_id, rarity, quantity)
      VALUES (p_user_id, v_rarity, v_delta);
    END IF;
  END LOOP;
  
  v_result := json_build_object('success', TRUE);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ==================== 索引优化 ====================
-- 为常用查询创建索引

-- 库存查询优化
CREATE INDEX IF NOT EXISTS idx_inventory_user_rarity 
ON inventory(user_id, rarity);

-- 升级查询优化
CREATE INDEX IF NOT EXISTS idx_upgrades_user_key 
ON upgrades(user_id, upgrade_key);

-- 每日任务查询优化
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date 
ON daily_tasks(user_id, date, task_key);

-- 统计查询优化
CREATE INDEX IF NOT EXISTS idx_stats_user 
ON stats(user_id);

-- ==================== 权限设置 ====================
-- 授予适当的执行权限（根据实际情况调整）

-- GRANT EXECUTE ON FUNCTION game_click TO authenticated;
-- GRANT EXECUTE ON FUNCTION game_sell TO authenticated;
-- GRANT EXECUTE ON FUNCTION game_upgrade_coins TO authenticated;
-- GRANT EXECUTE ON FUNCTION game_upgrade_eggs TO authenticated;
-- GRANT EXECUTE ON FUNCTION game_claim_task TO authenticated;
-- GRANT EXECUTE ON FUNCTION update_inventory_batch TO authenticated;

-- ==================== 使用说明 ====================
-- 
-- 1. 在 Supabase Dashboard 中运行此 SQL 脚本
-- 2. 或使用 Supabase CLI: supabase db push
-- 3. 在 TypeScript 中调用：
--    const { data } = await supabase.rpc('game_click', { ... });
-- 
-- 优势：
-- - 原子性操作（事务保证）
-- - 减少网络往返次数
-- - 更好的性能
-- - 数据一致性保证
