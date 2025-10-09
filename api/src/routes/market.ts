// ==================== 市场交易路由 ====================
// 玩家之间买卖蛋的交易系统

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { generateId, isValidRarity } from '../utils/helpers';
import { getSupabase } from '../lib/supabase';

const market = new Hono<{ Bindings: Env }>();

// ==================== GET /api/market/orders ====================
// 获取市场挂单列表（可筛选稀有度）

market.get('/orders', async (c) => {
  const rarity = c.req.query('rarity');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const supabase = getSupabase(c.env);
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!seller_id(nickname)
      `)
      .eq('status', 'open');

    if (rarity && isValidRarity(rarity)) {
      query = query.eq('rarity', rarity);
    }

    const { data: orders, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Market Orders Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    return c.json({
      success: true,
      data: {
        orders: orders || [],
        total: orders?.length || 0,
      },
    });
  } catch (error) {
    console.error('[Market Orders Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/market/create-order ====================
// 创建卖单

market.post('/create-order', async (c) => {
  const { rarity, quantity, priceCoins } = await c.req.json<{
    rarity: string;
    quantity: number;
    priceCoins: number;
  }>();
  const user = c.get('user');

  // 验证输入
  if (!rarity || !quantity || !priceCoins || quantity <= 0 || priceCoins <= 0) {
    throw Errors.INVALID_INPUT;
  }

  if (!isValidRarity(rarity)) {
    throw Errors.INVALID_INPUT;
  }

  try {
    // TODO: 实现创建订单逻辑
    // 1. 检查库存是否足够
    // 2. 扣除库存
    // 3. 创建订单记录
    // 4. 返回订单信息

    const orderId = generateId();

    return c.json({
      success: true,
      data: {
        message: 'Create order logic to be implemented',
        orderId,
      },
    });
  } catch (error) {
    console.error('[Market Create Order Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/market/buy-order ====================
// 购买订单

market.post('/buy-order', async (c) => {
  const { orderId } = await c.req.json<{ orderId: string }>();
  const user = c.get('user');

  // 验证输入
  if (!orderId) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    
    // 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('status', 'open')
      .single();

    if (orderError || !order) {
      throw Errors.ORDER_NOT_AVAILABLE;
    }

    // 不能购买自己的订单
    if (order.seller_id === user.userId) {
      throw Errors.CANNOT_BUY_OWN_ORDER;
    }

    // TODO: 实现购买订单逻辑
    // 1. 检查买家金币是否足够
    // 2. 扣除买家金币（包含手续费）
    // 3. 增加卖家金币（扣除手续费后）
    // 4. 增加买家库存
    // 5. 更新订单状态为 'sold'
    // 6. 创建交易记录

    return c.json({
      success: true,
      data: {
        message: 'Buy order logic to be implemented',
      },
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    console.error('[Market Buy Order Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== POST /api/market/cancel-order ====================
// 取消订单

market.post('/cancel-order', async (c) => {
  const { orderId } = await c.req.json<{ orderId: string }>();
  const user = c.get('user');

  // 验证输入
  if (!orderId) {
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    
    // 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('seller_id', user.userId)
      .single();

    if (orderError || !order) {
      throw Errors.NOT_FOUND;
    }

    if (order.status !== 'open') {
      throw Errors.INVALID_INPUT; // 订单已经不是待售状态
    }

    // TODO: 实现取消订单逻辑
    // 1. 更新订单状态为 'cancelled'
    // 2. 退还库存给卖家

    return c.json({
      success: true,
      data: {
        message: 'Cancel order logic to be implemented',
      },
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    console.error('[Market Cancel Order Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== GET /api/market/my-orders ====================
// 获取我的订单列表

market.get('/my-orders', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Market My Orders Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    return c.json({
      success: true,
      data: {
        orders: orders || [],
      },
    });
  } catch (error) {
    console.error('[Market My Orders Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== GET /api/market/transactions ====================
// 获取我的交易记录

market.get('/transactions', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        buyer:profiles!buyer_id(nickname),
        seller:profiles!seller_id(nickname)
      `)
      .or(`buyer_id.eq.${user.userId},seller_id.eq.${user.userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Market Transactions Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    return c.json({
      success: true,
      data: {
        transactions: transactions || [],
      },
    });
  } catch (error) {
    console.error('[Market Transactions Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

export default market;
