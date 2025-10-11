-- ==================== 市场交易系统 RPC 函数（修复版）====================
-- 修复: 将 TEXT 类型改为 UUID 类型以匹配 Supabase 的数据类型

-- ==================== 删除旧函数 ====================
DROP FUNCTION IF EXISTS create_market_order(TEXT, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS buy_market_order(TEXT, TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS cancel_market_order(TEXT, TEXT);

-- ==================== 创建订单 ====================
CREATE OR REPLACE FUNCTION create_market_order(
  p_seller_id UUID,
  p_order_id UUID,
  p_rarity TEXT,
  p_quantity INTEGER,
  p_price_coins INTEGER
) RETURNS JSON AS $$
DECLARE
  v_current_quantity INTEGER;
  v_result JSON;
BEGIN
  -- 锁定库存行防止并发问题
  SELECT quantity INTO v_current_quantity
  FROM inventory
  WHERE user_id = p_seller_id AND rarity = p_rarity
  FOR UPDATE;

  -- 检查库存是否足够
  IF v_current_quantity IS NULL OR v_current_quantity < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_INVENTORY',
      'current', COALESCE(v_current_quantity, 0),
      'required', p_quantity
    );
  END IF;

  -- 扣除库存
  UPDATE inventory
  SET 
    quantity = quantity - p_quantity,
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE user_id = p_seller_id AND rarity = p_rarity;

  -- 创建订单
  INSERT INTO orders (id, seller_id, rarity, quantity, price_coins, status, created_at, updated_at)
  VALUES (
    p_order_id,
    p_seller_id,
    p_rarity,
    p_quantity,
    p_price_coins,
    'open',
    EXTRACT(EPOCH FROM NOW())::INTEGER,
    EXTRACT(EPOCH FROM NOW())::INTEGER
  );

  -- 返回成功结果
  RETURN json_build_object(
    'success', true,
    'orderId', p_order_id,
    'rarity', p_rarity,
    'quantity', p_quantity,
    'priceCoins', p_price_coins
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ==================== 购买订单 ====================
CREATE OR REPLACE FUNCTION buy_market_order(
  p_buyer_id UUID,
  p_order_id UUID,
  p_transaction_id UUID,
  p_fee_rate NUMERIC DEFAULT 0.05
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_buyer_coins INTEGER;
  v_seller_coins INTEGER;
  v_total_cost INTEGER;
  v_fee INTEGER;
  v_seller_receive INTEGER;
  v_result JSON;
BEGIN
  -- 锁定订单（防止重复购买）
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND status = 'open'
  FOR UPDATE;

  -- 检查订单是否存在且可用
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ORDER_NOT_AVAILABLE'
    );
  END IF;

  -- 不能购买自己的订单
  IF v_order.seller_id = p_buyer_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CANNOT_BUY_OWN_ORDER'
    );
  END IF;

  -- 计算费用
  v_total_cost := v_order.price_coins;
  v_fee := FLOOR(v_total_cost * p_fee_rate);
  v_seller_receive := v_total_cost - v_fee;

  -- 锁定买家和卖家的资料
  SELECT coins INTO v_buyer_coins
  FROM profiles
  WHERE user_id = p_buyer_id
  FOR UPDATE;

  SELECT coins INTO v_seller_coins
  FROM profiles
  WHERE user_id = v_order.seller_id
  FOR UPDATE;

  -- 检查买家金币是否足够
  IF v_buyer_coins < v_total_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_COINS',
      'required', v_total_cost,
      'current', v_buyer_coins
    );
  END IF;

  -- 扣除买家金币
  UPDATE profiles
  SET coins = coins - v_total_cost
  WHERE user_id = p_buyer_id;

  -- 增加卖家金币（扣除手续费）
  UPDATE profiles
  SET coins = coins + v_seller_receive
  WHERE user_id = v_order.seller_id;

  -- 增加买家库存
  UPDATE inventory
  SET 
    quantity = quantity + v_order.quantity,
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE user_id = p_buyer_id AND rarity = v_order.rarity;

  -- 更新订单状态
  UPDATE orders
  SET 
    status = 'sold',
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE id = p_order_id;

  -- 创建交易记录
  INSERT INTO transactions (
    id,
    buyer_id,
    seller_id,
    order_id,
    rarity,
    quantity,
    price_total,
    fee,
    created_at
  ) VALUES (
    p_transaction_id,
    p_buyer_id,
    v_order.seller_id,
    p_order_id,
    v_order.rarity,
    v_order.quantity,
    v_total_cost,
    v_fee,
    EXTRACT(EPOCH FROM NOW())::INTEGER
  );

  -- 返回成功结果
  RETURN json_build_object(
    'success', true,
    'transactionId', p_transaction_id,
    'rarity', v_order.rarity,
    'quantity', v_order.quantity,
    'totalCost', v_total_cost,
    'fee', v_fee,
    'sellerReceived', v_seller_receive
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ==================== 取消订单 ====================
CREATE OR REPLACE FUNCTION cancel_market_order(
  p_seller_id UUID,
  p_order_id UUID
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_result JSON;
BEGIN
  -- 锁定订单
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND seller_id = p_seller_id AND status = 'open'
  FOR UPDATE;

  -- 检查订单是否存在且属于卖家
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ORDER_NOT_FOUND'
    );
  END IF;

  -- 退还库存
  UPDATE inventory
  SET 
    quantity = quantity + v_order.quantity,
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE user_id = p_seller_id AND rarity = v_order.rarity;

  -- 更新订单状态
  UPDATE orders
  SET 
    status = 'cancelled',
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE id = p_order_id;

  -- 返回成功结果
  RETURN json_build_object(
    'success', true,
    'orderId', p_order_id,
    'rarity', v_order.rarity,
    'quantity', v_order.quantity,
    'refunded', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ==================== 完成 ====================
-- 修复版市场交易 RPC 函数创建完成
-- 现在使用 UUID 类型而不是 TEXT 类型
