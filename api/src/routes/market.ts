// ==================== 市场交易路由 ====================
// 玩家之间买卖蛋的交易系统

import { Hono } from 'hono';
import { Env } from '../index';
import { Errors } from '../middleware/errorHandler';
import { generateUUID, isValidRarity } from '../utils/helpers';
import { getSupabase } from '../lib/supabase';
import { 
  GAME_CONFIG,
  validateMarketOrder, 
  calculateMarketFee, 
  calculateSellerReceive,
  calculateUnitPrice
} from '../utils/gameLogic';
import { callRPC } from '../utils/database';

const market = new Hono<{ Bindings: Env }>();

// ==================== GET /api/market/orders ====================
// 获取市场挂单列表（可筛选稀有度）

market.get('/orders', async (c) => {
  const rarity = c.req.query('rarity');
  const sortBy = c.req.query('sortBy') || 'created_at';  // created_at, price_coins
  const sortOrder = c.req.query('sortOrder') || 'desc';   // asc, desc
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);  // 最多100条
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const supabase = getSupabase(c.env);
    
    // 构建查询（暂时不关联 profiles，避免外键问题）
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('status', 'open');

    // 稀有度筛选
    if (rarity && isValidRarity(rarity)) {
      query = query.eq('rarity', rarity);
    }

    // 排序
    const validSortFields = ['created_at', 'price_coins', 'quantity'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';

    const { data: orders, error, count } = await query
      .order(sortField, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Market Orders Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    // 获取所有卖家的 ID
    const sellerIds = [...new Set((orders || []).map(order => order.seller_id))];
    
    // 批量查询卖家信息
    let sellersMap: Record<string, { nickname: string; avatar?: string }> = {};
    if (sellerIds.length > 0) {
      const { data: sellers, error: sellerError } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar')
        .in('user_id', sellerIds);
      
      if (!sellerError && sellers) {
        sellersMap = sellers.reduce((acc, seller) => {
          acc[seller.user_id] = {
            nickname: seller.nickname,
            avatar: seller.avatar,
          };
          return acc;
        }, {} as Record<string, { nickname: string; avatar?: string }>);
      }
    }

    // 计算每个订单的额外信息，并添加卖家信息
    const enrichedOrders = (orders || []).map(order => ({
      ...order,
      seller: sellersMap[order.seller_id] || { nickname: 'Unknown', avatar: null },
      unitPrice: calculateUnitPrice(order.price_coins, order.quantity),
      fee: calculateMarketFee(order.price_coins),
      sellerWillReceive: calculateSellerReceive(order.price_coins),
    }));

    return c.json({
      success: true,
      data: {
        orders: enrichedOrders,
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
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
  if (!rarity || !quantity || !priceCoins) {
    throw Errors.INVALID_INPUT;
  }

  // 验证订单参数
  const validation = validateMarketOrder(rarity, quantity, priceCoins);
  if (!validation.valid) {
    // 如果是不可交易的蛋类型，抛出对应错误
    if (validation.error === 'NOT_TRADABLE') {
      throw Errors.NOT_TRADABLE;
    }
    throw Errors.INVALID_INPUT;
  }

  try {
    const supabase = getSupabase(c.env);
    const orderId = generateUUID();

    // 检查用户当前挂单数
    const { data: existingOrders, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: false })
      .eq('seller_id', user.userId)
      .eq('status', 'open');

    if (countError) {
      console.error('[Market Order Count Error]', countError);
      throw Errors.DATABASE_ERROR;
    }

    if ((existingOrders?.length || 0) >= GAME_CONFIG.MARKET.MAX_ORDERS_PER_USER) {
      return c.json({
        success: false,
        error: {
          code: 'TOO_MANY_ORDERS',
          message: `最多同时挂${GAME_CONFIG.MARKET.MAX_ORDERS_PER_USER}个订单`,
        },
      }, 400);
    }

    // 调用RPC函数创建订单（原子性操作）
    console.log('[Market Create Order] Calling RPC with:', {
      p_seller_id: user.userId,
      p_order_id: orderId,
      p_rarity: rarity,
      p_quantity: quantity,
      p_price_coins: priceCoins,
    });
    
    const result = await callRPC(supabase, 'create_market_order', {
      p_seller_id: user.userId,
      p_order_id: orderId,
      p_rarity: rarity,
      p_quantity: quantity,
      p_price_coins: priceCoins,
    });

    console.log('[Market Create Order] RPC result:', result);

    // 检查结果
    if (!result.success) {
      console.log('[Market Create Order] RPC failed:', result.error);
      if (result.error === 'INSUFFICIENT_INVENTORY') {
        console.log('[Market Create Order] Throwing INSUFFICIENT_INVENTORY error');
        throw Errors.INSUFFICIENT_INVENTORY;
      }
      console.log('[Market Create Order] Throwing DATABASE_ERROR');
      throw Errors.DATABASE_ERROR;
    }

    // 计算并返回讦单信息
    const fee = calculateMarketFee(priceCoins);
    const sellerWillReceive = calculateSellerReceive(priceCoins);
    const unitPrice = calculateUnitPrice(priceCoins, quantity);

    return c.json({
      success: true,
      data: {
        order: {
          id: orderId,
          rarity,
          quantity,
          priceCoins,
          unitPrice,
          fee,
          sellerWillReceive,
          status: 'open',
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
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
    const transactionId = generateUUID();

    // 调用RPC函数购买订单（原子性操作）
    const result = await callRPC(supabase, 'buy_market_order', {
      p_buyer_id: user.userId,
      p_order_id: orderId,
      p_transaction_id: transactionId,
      p_fee_rate: GAME_CONFIG.MARKET.FEE_RATE,
    });

    // 检查结果
    if (!result.success) {
      if (result.error === 'ORDER_NOT_AVAILABLE') {
        throw Errors.ORDER_NOT_AVAILABLE;
      }
      if (result.error === 'CANNOT_BUY_OWN_ORDER') {
        throw Errors.CANNOT_BUY_OWN_ORDER;
      }
      if (result.error === 'INSUFFICIENT_COINS') {
        throw Errors.INSUFFICIENT_COINS;
      }
      throw Errors.DATABASE_ERROR;
    }

    return c.json({
      success: true,
      data: {
        transaction: {
          id: result.transactionId,
          rarity: result.rarity,
          quantity: result.quantity,
          totalCost: result.totalCost,
          fee: result.fee,
        },
        message: '购买成功',
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

    // 调用RPC函数取消订单（原子性操作）
    const result = await callRPC(supabase, 'cancel_market_order', {
      p_seller_id: user.userId,
      p_order_id: orderId,
    });

    // 检查结果
    if (!result.success) {
      if (result.error === 'ORDER_NOT_FOUND') {
        throw Errors.NOT_FOUND;
      }
      throw Errors.DATABASE_ERROR;
    }

    return c.json({
      success: true,
      data: {
        order: {
          id: result.orderId,
          rarity: result.rarity,
          quantity: result.quantity,
          refunded: true,
        },
        message: '订单已取消，库存已退还',
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

// ==================== GET /api/market/stats ====================
// 获取市场统计信息

market.get('/stats', async (c) => {
  try {
    const supabase = getSupabase(c.env);

    // 调用RPC函数获取统计
    const stats = await callRPC(supabase, 'get_market_stats', {});

    return c.json({
      success: true,
      data: {
        stats,
        feeRate: GAME_CONFIG.MARKET.FEE_RATE,
        config: {
          minPrice: GAME_CONFIG.MARKET.MIN_PRICE,
          maxPrice: GAME_CONFIG.MARKET.MAX_PRICE,
          minQuantity: GAME_CONFIG.MARKET.MIN_QUANTITY,
          maxQuantity: GAME_CONFIG.MARKET.MAX_QUANTITY,
          maxOrdersPerUser: GAME_CONFIG.MARKET.MAX_ORDERS_PER_USER,
        },
      },
    });
  } catch (error) {
    console.error('[Market Stats Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

// ==================== GET /api/market/transactions ====================
// 获取我的交易记录

market.get('/transactions', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);
    
    // 先获取交易记录
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`buyer_id.eq.${user.userId},seller_id.eq.${user.userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Market Transactions Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    // 如果没有交易记录，直接返回
    if (!transactions || transactions.length === 0) {
      return c.json({
        success: true,
        data: {
          transactions: [],
        },
      });
    }

    // 获取所有涉及的用户 ID
    const userIds = [...new Set([
      ...transactions.map(tx => tx.buyer_id),
      ...transactions.map(tx => tx.seller_id)
    ])];

    // 批量查询用户信息
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, nickname')
      .in('user_id', userIds);

    if (profileError) {
      console.error('[Market Transactions Profile Error]', profileError);
      // 即使获取用户信息失败，也返回交易记录
      return c.json({
        success: true,
        data: {
          transactions: transactions.map(tx => ({
            ...tx,
            buyer: { nickname: 'Unknown' },
            seller: { nickname: 'Unknown' }
          })),
        },
      });
    }

    // 创建用户信息映射
    const profileMap = (profiles || []).reduce((acc, profile) => {
      acc[profile.user_id] = { nickname: profile.nickname };
      return acc;
    }, {} as Record<string, { nickname: string }>);

    // 给每个交易添加用户信息
    const enrichedTransactions = transactions.map(tx => ({
      ...tx,
      buyer: profileMap[tx.buyer_id] || { nickname: 'Unknown' },
      seller: profileMap[tx.seller_id] || { nickname: 'Unknown' }
    }));

    return c.json({
      success: true,
      data: {
        transactions: enrichedTransactions,
      },
    });
  } catch (error) {
    console.error('[Market Transactions Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});

export default market;
