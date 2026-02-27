/**
 * 市场交易模块
 * 提供玩家之间买卖鸡蛋的功能
 */

import { state, saveGame, logCoinChange } from './state.js';
import { showFloatText } from './ui.js';
import { t, i18n } from './i18n.js';
import { CONFIG } from './config.js';

// ==================== 市场状态 ====================

// 可交易的蛋类型（只允许紫蛋、金蛋、黑蛋）
export const TRADABLE_RARITIES = ['purple', 'gold', 'black'];

export const marketState = {
  orders: [],           // 当前市场订单列表
  myOrders: [],         // 我的订单
  transactions: [],     // 交易记录
  stats: null,          // 市场统计
  currentFilter: 'all', // 筛选条件 (all/purple/gold/black)
  currentSort: 'created_at', // 排序字段
  currentSortOrder: 'desc',  // 排序方向
  isLoading: false,     // 加载状态
  // 分页相关
  currentPage: 1,       // 当前页码
  pageSize: 20,         // 每页数量
  totalCount: 0,        // 总订单数
  hasMore: false,       // 是否有下一页
  // 自动刷新
  autoRefreshTimer: null,  // 自动刷新定时器
  isAutoRefreshEnabled: false, // 是否启用自动刷新
  // 搜索和筛选
  searchKeyword: '',       // 搜索关键词
  minPrice: null,          // 最低价
  maxPrice: null,          // 最高价
  minQuantity: null,       // 最小数量
  maxQuantity: null,       // 最大数量
  allOrders: [],           // 所有订单（用于前端筛选）
};

// ==================== API 调用函数 ====================

/**
 * 获取市场订单列表
 */
export async function fetchMarketOrders(rarity = null, sortBy = 'created_at', sortOrder = 'desc', page = null, limit = null) {
  const token = getAuthToken();
  // 允许未登录用户浏览市场订单
  // if (!token) {
  //   showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'pleaseLogin'));
  //   return null;
  // }

  try {
    marketState.isLoading = true;
    updateLoadingState(true);

    // 使用传入的参数或默认值
    const currentPage = page !== null ? page : marketState.currentPage;
    const pageSize = limit !== null ? limit : marketState.pageSize;
    const offset = (currentPage - 1) * pageSize;

    let url = `${CONFIG.API_BASE_URL}/market/orders?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${pageSize}&offset=${offset}`;
    if (rarity && rarity !== 'all') {
      url += `&rarity=${rarity}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      marketState.allOrders = result.data.orders || [];
      marketState.orders = filterOrders(marketState.allOrders);
      marketState.totalCount = result.data.total || 0;
      marketState.hasMore = result.data.hasMore || false;
      marketState.currentPage = currentPage;
      marketState.pageSize = pageSize;
      
      console.log('[Market] Fetched orders:', marketState.orders.length, 'Total:', marketState.totalCount, 'Page:', currentPage);
      
      // 更新分页UI
      updatePaginationUI();
      
      return result.data;
    } else {
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, result.error?.message || 'Failed to load orders');
      return null;
    }
  } catch (error) {
    console.error('[Market] Failed to fetch orders:', error);
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, 'Network error');
    return null;
  } finally {
    marketState.isLoading = false;
    updateLoadingState(false);
  }
}

/**
 * 创建卖单
 */
export async function createOrder(rarity, quantity, priceCoins) {
  // 验证蛋类型是否可交易
  if (!TRADABLE_RARITIES.includes(rarity)) {
    const msg = state.language === 'zh' 
      ? `只能交易紫蛋、金蛋和黑蛋！` 
      : 'Only purple, gold, and black eggs can be traded!';
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, msg, 'error');
    return false;
  }
  
  const token = getAuthToken();
  if (!token) {
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'pleaseLogin'));
    return false;
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/market/create-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rarity, quantity, priceCoins })
    });

    const result = await response.json();

    if (result.success) {
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'orderCreated'), 'success');
      
      // 刷新我的订单和市场订单
      await fetchMyOrders();
      await fetchMarketOrders(marketState.currentFilter, marketState.currentSort, marketState.currentSortOrder);
      
      return true;
    } else {
      const errorMsg = getErrorMessage(result.error?.code, result.error?.data) || result.error?.message || 'Failed to create order';
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, errorMsg, 'error');
      return false;
    }
  } catch (error) {
    console.error('[Market] Failed to create order:', error);
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, 'Network error', 'error');
    return false;
  }
}

/**
 * 购买订单
 */
export async function buyOrder(orderId) {
  const token = getAuthToken();
  if (!token) {
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'pleaseLogin'));
    return false;
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/market/buy-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    const result = await response.json();
    console.log('[Market] Buy order response:', result);

    if (result.success) {
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'purchaseSuccess'), 'success');
      
      // 更新本地状态：扮除金币，增加蛋
      if (result.data && result.data.order) {
        const order = result.data.order;
        if (order.price_coins && order.rarity && order.quantity) {
          state.coins -= order.price_coins;
          state.eggs[order.rarity] = (state.eggs[order.rarity] || 0) + order.quantity;
          
          // 记录金币变动
          logCoinChange(
            -order.price_coins, 
            'market_buy', 
            `${t(i18n, state.language, 'bought')} ${order.quantity}x ${t(i18n, state.language, `egg_${order.rarity}`)}`
          );
          
          saveGame();
          console.log('[Market] Local state updated: -', order.price_coins, 'coins, +', order.quantity, order.rarity, 'eggs');
        }
      }
      
      // 刷新市场订单和交易记录
      await fetchMarketOrders(marketState.currentFilter, marketState.currentSort, marketState.currentSortOrder);
      await fetchTransactions();
      
      return true;
    } else {
      const errorMsg = getErrorMessage(result.error?.code, result.error?.data) || result.error?.message || 'Failed to buy order';
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, errorMsg, 'error');
      return false;
    }
  } catch (error) {
    console.error('[Market] Failed to buy order:', error);
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, 'Network error', 'error');
    return false;
  }
}

/**
 * 取消订单
 */
export async function cancelOrder(orderId) {
  const token = getAuthToken();
  if (!token) {
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'pleaseLogin'));
    return false;
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/market/cancel-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    const result = await response.json();

    if (result.success) {
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'orderCancelled'), 'success');
      
      // 更新本地状态：返还蛋到背包
      if (result.data) {
        const order = result.data.order;
        state.eggs[order.rarity] = (state.eggs[order.rarity] || 0) + order.quantity;
        saveGame();
      }
      
      // 刷新我的订单
      await fetchMyOrders();
      await fetchMarketOrders(marketState.currentFilter, marketState.currentSort, marketState.currentSortOrder);
      
      return true;
    } else {
      const errorMsg = getErrorMessage(result.error?.code, result.error?.data) || result.error?.message || 'Failed to cancel order';
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, errorMsg, 'error');
      return false;
    }
  } catch (error) {
    console.error('[Market] Failed to cancel order:', error);
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, 'Network error', 'error');
    return false;
  }
}

/**
 * 获取我的订单列表
 */
export async function fetchMyOrders() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/market/my-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      marketState.myOrders = result.data.orders || [];
      return result.data.orders;
    }
    return null;
  } catch (error) {
    console.error('[Market] Failed to fetch my orders:', error);
    return null;
  }
}

/**
 * 获取交易记录
 */
export async function fetchTransactions() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/market/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      marketState.transactions = result.data.transactions || [];
      return result.data.transactions;
    }
    return null;
  } catch (error) {
    console.error('[Market] Failed to fetch transactions:', error);
    return null;
  }
}

/**
 * 获取市场统计
 */
export async function fetchMarketStats() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/market/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      marketState.stats = result.data;
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('[Market] Failed to fetch stats:', error);
    return null;
  }
}

// ==================== UI 更新函数 ====================

/**
 * 渲染市场订单列表
 */
export function renderMarketOrders() {
  const container = document.getElementById('marketOrdersGrid');
  if (!container) return;

  if (marketState.orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p data-i18n="noOrdersAvailable">${t(i18n, state.language, 'noOrdersAvailable')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = marketState.orders.map(order => {
    const rarityData = CONFIG.RARITIES[order.rarity];
    return `
    <div class="market-order-card" data-rarity="${order.rarity}">
      <div class="order-header">
        <img src="${rarityData.image}" alt="${order.rarity}" class="order-egg-img" />
        <div class="order-info">
          <h4 class="order-title">${t(i18n, state.language, `egg_${order.rarity}`)}</h4>
          <p class="order-seller">${t(i18n, state.language, 'seller')}: ${order.seller?.nickname || 'Unknown'}</p>
        </div>
      </div>
      <div class="order-details">
        <div class="order-stat">
          <span class="stat-label">${t(i18n, state.language, 'quantity')}</span>
          <span class="stat-value">${order.quantity}</span>
        </div>
        <div class="order-stat">
          <span class="stat-label">${t(i18n, state.language, 'totalPrice')}</span>
          <span class="stat-value">${order.price_coins} 💰</span>
        </div>
        <div class="order-stat">
          <span class="stat-label">${t(i18n, state.language, 'unitPrice')}</span>
          <span class="stat-value">${order.unitPrice} 💰</span>
        </div>
        <div class="order-stat">
          <span class="stat-label">${t(i18n, state.language, 'fee')}</span>
          <span class="stat-value text-muted">${order.fee} 💰</span>
        </div>
      </div>
      <button class="btn btn-primary" data-action="buy-order" data-order-id="${order.id}">
        ${t(i18n, state.language, 'buyNow')}
      </button>
    </div>
  `;
  }).join('');
}

/**
 * 计算个人订单统计
 */
function calculateMyOrdersStats(orders) {
  if (!orders || orders.length === 0) {
    return {
      totalOrders: 0,
      openOrders: 0,
      soldOrders: 0,
      totalRevenue: 0,
      avgPrice: 0,
      totalQuantity: 0
    };
  }
  
  const openOrders = orders.filter(o => o.status === 'open');
  const soldOrders = orders.filter(o => o.status === 'sold');
  
  // 计算总收益（已售出订单的总价格 - 手续费）
  const totalRevenue = soldOrders.reduce((sum, order) => {
    const fee = Math.floor(order.price_coins * 0.05);
    return sum + (order.price_coins - fee);
  }, 0);
  
  // 计算平均售价
  const avgPrice = soldOrders.length > 0 
    ? Math.round(soldOrders.reduce((sum, o) => sum + o.price_coins, 0) / soldOrders.length)
    : 0;
  
  // 计算总数量
  const totalQuantity = soldOrders.reduce((sum, o) => sum + o.quantity, 0);
  
  return {
    totalOrders: orders.length,
    openOrders: openOrders.length,
    soldOrders: soldOrders.length,
    totalRevenue,
    avgPrice,
    totalQuantity
  };
}

/**
 * 渲染个人订单统计
 */
function renderMyOrdersStats(stats) {
  const container = document.getElementById('myOrdersStats');
  if (!container) return;
  
  if (stats.totalOrders === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = `
    <div class="my-stats-container">
      <h3 class="my-stats-title">📈 个人统计</h3>
      <div class="my-stats-grid">
        <div class="my-stat-card">
          <div class="my-stat-icon">📋</div>
          <div class="my-stat-content">
            <div class="my-stat-value">${stats.totalOrders}</div>
            <div class="my-stat-label">总订单数</div>
          </div>
        </div>
        <div class="my-stat-card">
          <div class="my-stat-icon">🟢</div>
          <div class="my-stat-content">
            <div class="my-stat-value">${stats.openOrders}</div>
            <div class="my-stat-label">待售订单</div>
          </div>
        </div>
        <div class="my-stat-card">
          <div class="my-stat-icon">✅</div>
          <div class="my-stat-content">
            <div class="my-stat-value">${stats.soldOrders}</div>
            <div class="my-stat-label">已售订单</div>
          </div>
        </div>
        <div class="my-stat-card highlight">
          <div class="my-stat-icon">💰</div>
          <div class="my-stat-content">
            <div class="my-stat-value">${stats.totalRevenue} 💰</div>
            <div class="my-stat-label">总收益</div>
          </div>
        </div>
        <div class="my-stat-card">
          <div class="my-stat-icon">📉</div>
          <div class="my-stat-content">
            <div class="my-stat-value">${stats.avgPrice}</div>
            <div class="my-stat-label">平均售价</div>
          </div>
        </div>
        <div class="my-stat-card">
          <div class="my-stat-icon">🥚</div>
          <div class="my-stat-content">
            <div class="my-stat-value">${stats.totalQuantity}</div>
            <div class="my-stat-label">售出数量</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染我的订单列表
 */
export function renderMyOrders() {
  // 渲染统计
  const stats = calculateMyOrdersStats(marketState.myOrders);
  renderMyOrdersStats(stats);
  
  const container = document.getElementById('myOrdersGrid');
  if (!container) return;

  if (marketState.myOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p data-i18n="noMyOrders">${t(i18n, state.language, 'noMyOrders')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = marketState.myOrders.map(order => {
    const rarityData = CONFIG.RARITIES[order.rarity];
    return `
    <div class="my-order-card" data-status="${order.status}">
      <div class="order-header">
        <img src="${rarityData.image}" alt="${order.rarity}" class="order-egg-img-small" />
        <div class="order-info">
          <h4>${t(i18n, state.language, `egg_${order.rarity}`)} x${order.quantity}</h4>
          <span class="order-status status-${order.status}">${t(i18n, state.language, `status_${order.status}`)}</span>
        </div>
      </div>
      <div class="order-price">${order.price_coins} 💰</div>
      ${order.status === 'open' ? `
        <button class="btn btn-danger btn-sm" data-action="cancel-order" data-order-id="${order.id}">
          ${t(i18n, state.language, 'cancel')}
        </button>
      ` : ''}
    </div>
  `;
  }).join('');
}

/**
 * 渲染交易记录
 */
export function renderTransactions() {
  const container = document.getElementById('transactionsGrid');
  if (!container) return;

  if (marketState.transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📜</div>
        <p data-i18n="noTransactions">${t(i18n, state.language, 'noTransactions')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = marketState.transactions.map(tx => {
    const isBuyer = tx.buyer_id === state.userId;
    console.log('[Market] Transaction timestamp:', tx.created_at, typeof tx.created_at);
    return `
      <div class="transaction-card">
        <div class="tx-icon">${isBuyer ? '📥' : '📤'}</div>
        <div class="tx-info">
          <div class="tx-header">
            <span>${t(i18n, state.language, `egg_${tx.rarity}`)} x${tx.quantity}</span>
            <span class="tx-price">${tx.price_total} 💰</span>
          </div>
          <div class="tx-details">
            <span class="tx-type">${isBuyer ? t(i18n, state.language, 'bought') : t(i18n, state.language, 'sold')}</span>
            <span class="tx-partner">${isBuyer ? t(i18n, state.language, 'from') : t(i18n, state.language, 'to')}: ${isBuyer ? tx.seller?.nickname : tx.buyer?.nickname}</span>
            <span class="tx-date">${formatDate(tx.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染市场统计
 */
export function renderMarketStats() {
  const container = document.getElementById('marketStats');
  if (!container || !marketState.stats) return;

  const stats = marketState.stats.stats;
  const byRarity = stats.byRarity || {};
  
  // 基础统计卡片
  const basicStats = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">${stats.openOrders || 0}</div>
          <div class="stat-label">${t(i18n, state.language, 'activeOrders')}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">${stats.soldOrders || 0}</div>
          <div class="stat-label">${t(i18n, state.language, 'completedTrades')}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalVolume || 0}</div>
          <div class="stat-label">${t(i18n, state.language, 'totalVolume')}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">${marketState.stats.feeRate * 100}%</div>
          <div class="stat-label">${t(i18n, state.language, 'tradingFee')}</div>
        </div>
      </div>
    </div>
  `;
  
  // 稀有度统计
  const rarityStatsHtml = Object.keys(byRarity).length > 0 ? `
    <div class="advanced-stats">
      <h3 class="advanced-stats-title">🎯 稀有度统计</h3>
      <div class="rarity-stats-grid">
        ${Object.entries(byRarity).map(([rarity, data]) => {
          const rarityConfig = CONFIG.RARITIES[rarity];
          if (!rarityConfig) return '';
          
          // 计算价格趋势
          const avgPrice = data.avgPrice || 0;
          const minPrice = data.minPrice || 0;
          const maxPrice = data.maxPrice || 0;
          const priceRange = maxPrice - minPrice;
          const avgPosition = priceRange > 0 ? ((avgPrice - minPrice) / priceRange) * 100 : 50;
          
          return `
            <div class="rarity-stat-card" data-rarity="${rarity}">
              <div class="rarity-stat-header">
                <img src="${rarityConfig.image}" alt="${rarity}" class="rarity-stat-icon" />
                <span class="rarity-stat-name">${t(i18n, state.language, `egg_${rarity}`)}</span>
              </div>
              <div class="rarity-stat-data">
                <div class="rarity-stat-row">
                  <span class="rarity-stat-label">📉 在售:</span>
                  <span class="rarity-stat-value">${data.count || 0}</span>
                </div>
                <div class="rarity-stat-row">
                  <span class="rarity-stat-label">💰 均价:</span>
                  <span class="rarity-stat-value">${Math.round(avgPrice)}</span>
                </div>
                <div class="rarity-stat-row">
                  <span class="rarity-stat-label">🔽 最低:</span>
                  <span class="rarity-stat-value">${minPrice}</span>
                </div>
                <div class="rarity-stat-row">
                  <span class="rarity-stat-label">🔼 最高:</span>
                  <span class="rarity-stat-value">${maxPrice}</span>
                </div>
              </div>
              <!-- 价格趋势指示器 -->
              <div class="price-trend-indicator">
                <div class="price-range-bar">
                  <div class="price-min-marker" title="最低价: ${minPrice}">🔽</div>
                  <div class="price-avg-marker" style="left: ${avgPosition}%" title="均价: ${Math.round(avgPrice)}">📊</div>
                  <div class="price-max-marker" title="最高价: ${maxPrice}">🔼</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';
  
  container.innerHTML = basicStats + rarityStatsHtml;
}

// ==================== 辅助函数 ====================

/**
 * 获取认证 Token
 */
function getAuthToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

/**
 * 获取错误消息
 */
function getErrorMessage(errorCode, errorData = {}) {
  // 如果有详细错误信息，使用详细版本
  if (errorCode === 'INSUFFICIENT_INVENTORY' && errorData.current !== undefined && errorData.required !== undefined) {
    return t(i18n, state.language, 'insufficientInventoryDetail', {
      current: errorData.current,
      required: errorData.required
    });
  }
  
  if (errorCode === 'INSUFFICIENT_COINS' && errorData.current !== undefined && errorData.required !== undefined) {
    return t(i18n, state.language, 'insufficientCoinsDetail', {
      current: errorData.current,
      required: errorData.required
    });
  }
  
  // 否则使用通用错误消息
  const errorMessages = {
    'INSUFFICIENT_INVENTORY': t(i18n, state.language, 'insufficientInventory'),
    'INSUFFICIENT_COINS': t(i18n, state.language, 'insufficientCoins'),
    'ORDER_NOT_AVAILABLE': t(i18n, state.language, 'orderNotAvailable'),
    'CANNOT_BUY_OWN_ORDER': t(i18n, state.language, 'cannotBuyOwnOrder'),
    'NOT_TRADABLE': t(i18n, state.language, 'notTradable'),
    'INVALID_INPUT': t(i18n, state.language, 'invalidInput'),
    'TOO_MANY_ORDERS': t(i18n, state.language, 'tooManyOrders'),
  };
  return errorMessages[errorCode] || null;
}

/**
 * 格式化日期
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  
  let date;
  // 尝试不同的时间戳格式
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    // 判断是否是秒级时间戳（小于JavaScript毫秒时间戳）
    if (timestamp < 10000000000) {
      date = new Date(timestamp * 1000);
    } else {
      date = new Date(timestamp);
    }
  } else {
    return 'Invalid Date';
  }
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    console.warn('[Market] Invalid timestamp:', timestamp);
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString(state.language === 'zh' ? 'zh-CN' : 'en-US');
}


// ==================== 事件处理 ====================

/**
 * 处理筛选变更
 */
export function handleFilterChange(rarity) {
  console.log('[Market] Filter changed to:', rarity);
  marketState.currentFilter = rarity;
  marketState.currentPage = 1; // 重置到第一页
  return fetchMarketOrders(rarity, marketState.currentSort, marketState.currentSortOrder, 1);
}

/**
 * 处理排序变更
 */
export function handleSortChange(sortBy, sortOrder) {
  marketState.currentSort = sortBy;
  marketState.currentSortOrder = sortOrder;
  marketState.currentPage = 1; // 重置到第一页
  return fetchMarketOrders(marketState.currentFilter, sortBy, sortOrder, 1);
}

/**
 * 初始化市场UI
 */
export async function initMarketUI() {
  console.log('[Market] Initializing market UI...');
  
  // 初始化分页事件监听
  initPaginationEvents();
  
  // 初始化搜索和筛选事件
  initSearchAndFilterEvents();
  
  // 加载市场数据
  await Promise.all([
    fetchMarketOrders(marketState.currentFilter, marketState.currentSort, marketState.currentSortOrder),
    fetchMarketStats()
  ]);

  renderMarketOrders();
  renderMarketStats();
}

// ==================== 分页相关功能 ====================

/**
 * 更新分页UI
 */
function updatePaginationUI() {
  const totalPages = Math.ceil(marketState.totalCount / marketState.pageSize);
  const currentPage = marketState.currentPage;
  
  // 更新信息显示
  const infoEl = document.getElementById('paginationInfo');
  if (infoEl) {
    const start = (currentPage - 1) * marketState.pageSize + 1;
    const end = Math.min(currentPage * marketState.pageSize, marketState.totalCount);
    infoEl.textContent = `${start}-${end} / ${marketState.totalCount}`;
  }
  
  // 更新上一页/下一页按钮状态
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  
  // 更新页码显示
  const pagesContainer = document.getElementById('paginationPages');
  if (pagesContainer) {
    pagesContainer.innerHTML = generatePageNumbers(currentPage, totalPages);
  }
}

/**
 * 生成页码HTML
 */
function generatePageNumbers(currentPage, totalPages) {
  if (totalPages === 0) return '<span class="page-number active">1</span>';
  
  const pages = [];
  const maxVisible = 5; // 最多显示5个页码
  
  if (totalPages <= maxVisible) {
    // 总页数少，显示所有页码
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // 总页数多，显示当前页附近的页码
    pages.push(1); // 总是显示第一页
    
    if (currentPage > 3) {
      pages.push('...'); // 省略号
    }
    
    // 显示当前页附近的页码
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...'); // 省略号
    }
    
    if (!pages.includes(totalPages)) {
      pages.push(totalPages); // 总是显示最后一页
    }
  }
  
  return pages.map(page => {
    if (page === '...') {
      return '<span class="page-number dots">...</span>';
    }
    const isActive = page === currentPage;
    return `<span class="page-number ${isActive ? 'active' : ''}" data-page="${page}">${page}</span>`;
  }).join('');
}

/**
 * 初始化分页事件
 */
function initPaginationEvents() {
  // 上一页
  const prevBtn = document.getElementById('prevPageBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (marketState.currentPage > 1) {
        goToPage(marketState.currentPage - 1);
      }
    });
  }
  
  // 下一页
  const nextBtn = document.getElementById('nextPageBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(marketState.totalCount / marketState.pageSize);
      if (marketState.currentPage < totalPages) {
        goToPage(marketState.currentPage + 1);
      }
    });
  }
  
  // 页码点击
  const pagesContainer = document.getElementById('paginationPages');
  if (pagesContainer) {
    pagesContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('page-number') && !e.target.classList.contains('dots')) {
        const page = parseInt(e.target.dataset.page);
        if (page && page !== marketState.currentPage) {
          goToPage(page);
        }
      }
    });
  }
  
  // 每页数量选择
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      const newSize = parseInt(e.target.value);
      marketState.pageSize = newSize;
      marketState.currentPage = 1; // 重置到第一页
      fetchMarketOrders(
        marketState.currentFilter,
        marketState.currentSort,
        marketState.currentSortOrder,
        1,
        newSize
      ).then(() => {
        renderMarketOrders();
      });
    });
  }
}

/**
 * 跳转到指定页
 */
async function goToPage(page) {
  await fetchMarketOrders(
    marketState.currentFilter,
    marketState.currentSort,
    marketState.currentSortOrder,
    page
  );
  renderMarketOrders();
  
  // 滚动到订单列表顶部
  const ordersGrid = document.getElementById('marketOrdersGrid');
  if (ordersGrid) {
    ordersGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * 更新加载状态
 */
function updateLoadingState(isLoading) {
  const loadingEl = document.getElementById('marketLoading');
  if (loadingEl) {
    loadingEl.style.display = isLoading ? 'flex' : 'none';
  }
}

// ==================== 自动刷新功能 ====================

/**
 * 启动自动刷新
 */
export function startAutoRefresh() {
  console.log('[Market] Starting auto refresh...');
  
  // 如果已经启动，先停止
  if (marketState.autoRefreshTimer) {
    stopAutoRefresh();
  }
  
  marketState.isAutoRefreshEnabled = true;
  
  // 设置30秒的定时器
  marketState.autoRefreshTimer = setInterval(async () => {
    if (!marketState.isLoading && marketState.isAutoRefreshEnabled) {
      console.log('[Market] Auto refreshing orders...');
      
      // 显示刷新提示
      showRefreshIndicator();
      
      // 刷新市场订单和统计
      await fetchMarketOrders(
        marketState.currentFilter,
        marketState.currentSort,
        marketState.currentSortOrder,
        marketState.currentPage
      );
      renderMarketOrders();
      
      await fetchMarketStats();
      renderMarketStats();
      
      // 隐藏刷新提示
      hideRefreshIndicator();
    }
  }, 30000); // 30秒
  
  console.log('[Market] Auto refresh started');
}

/**
 * 停止自动刷新
 */
export function stopAutoRefresh() {
  console.log('[Market] Stopping auto refresh...');
  
  if (marketState.autoRefreshTimer) {
    clearInterval(marketState.autoRefreshTimer);
    marketState.autoRefreshTimer = null;
  }
  
  marketState.isAutoRefreshEnabled = false;
  console.log('[Market] Auto refresh stopped');
}

/**
 * 显示刷新提示
 */
function showRefreshIndicator() {
  // 在市场统计区域顶部显示小型加载指示器
  const statsContainer = document.querySelector('.market-stats');
  if (statsContainer && !document.getElementById('refreshIndicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'refreshIndicator';
    indicator.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(245, 158, 11, 0.95);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease-out;
    `;
    indicator.innerHTML = `
      <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
      <span>刷新中...</span>
    `;
    document.body.appendChild(indicator);
  }
}

/**
 * 隐藏刷新提示
 */
function hideRefreshIndicator() {
  const indicator = document.getElementById('refreshIndicator');
  if (indicator) {
    indicator.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => indicator.remove(), 300);
  }
}

// ==================== 搜索和筛选功能 ====================

/**
 * 过滤订单（根据搜索关键词、价格区间和数量区间）
 */
function filterOrders(orders) {
  let filtered = [...orders];
  
  // 按卖家昵称搜索
  if (marketState.searchKeyword) {
    const keyword = marketState.searchKeyword.toLowerCase();
    filtered = filtered.filter(order => {
      const sellerName = order.seller?.nickname || '';
      return sellerName.toLowerCase().includes(keyword);
    });
  }
  
  // 按价格区间筛选
  if (marketState.minPrice !== null) {
    filtered = filtered.filter(order => order.price_coins >= marketState.minPrice);
  }
  if (marketState.maxPrice !== null) {
    filtered = filtered.filter(order => order.price_coins <= marketState.maxPrice);
  }
  
  // 按数量区间筛选
  if (marketState.minQuantity !== null) {
    filtered = filtered.filter(order => order.quantity >= marketState.minQuantity);
  }
  if (marketState.maxQuantity !== null) {
    filtered = filtered.filter(order => order.quantity <= marketState.maxQuantity);
  }
  
  return filtered;
}

/**
 * 应用搜索
 */
export function applySearch(keyword) {
  marketState.searchKeyword = keyword;
  marketState.orders = filterOrders(marketState.allOrders);
  renderMarketOrders();
  
  // 显示/隐藏清除按钮
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    clearBtn.style.display = keyword ? 'block' : 'none';
  }
  
  console.log('[Market] Search applied:', keyword, 'Results:', marketState.orders.length);
}

/**
 * 清除搜索
 */
export function clearSearch() {
  marketState.searchKeyword = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  
  marketState.orders = filterOrders(marketState.allOrders);
  renderMarketOrders();
  
  console.log('[Market] Search cleared');
}

/**
 * 应用价格筛选
 */
export function applyPriceFilter(min, max) {
  marketState.minPrice = min;
  marketState.maxPrice = max;
  marketState.orders = filterOrders(marketState.allOrders);
  renderMarketOrders();
  
  console.log('[Market] Price filter applied:', min, '-', max, 'Results:', marketState.orders.length);
}

/**
 * 应用快捷价格筛选
 */
export function applyQuickPriceFilter(range) {
  if (range === 'all') {
    marketState.minPrice = null;
    marketState.maxPrice = null;
  } else {
    const [min, max] = range.split('-').map(Number);
    marketState.minPrice = min;
    marketState.maxPrice = max === 99999 ? null : max;
  }
  
  marketState.orders = filterOrders(marketState.allOrders);
  renderMarketOrders();
  
  console.log('[Market] Quick price filter applied:', range, 'Results:', marketState.orders.length);
}

/**
 * 应用快捷数量筛选
 */
export function applyQuickQuantityFilter(range) {
  if (range === 'all') {
    marketState.minQuantity = null;
    marketState.maxQuantity = null;
  } else {
    const [min, max] = range.split('-').map(Number);
    marketState.minQuantity = min;
    marketState.maxQuantity = max === 99999 ? null : max;
  }
  
  marketState.orders = filterOrders(marketState.allOrders);
  renderMarketOrders();
  
  console.log('[Market] Quick quantity filter applied:', range, 'Results:', marketState.orders.length);
}

/**
 * 初始化搜索和筛选事件
 */
export function initSearchAndFilterEvents() {
  // 搜索按钮
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const keyword = searchInput.value.trim();
      applySearch(keyword);
    });
    
    // 回车键搜索
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const keyword = searchInput.value.trim();
        applySearch(keyword);
      }
    });
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
  }
  
  // 快捷价格筛选按钮
  document.querySelectorAll('.price-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = btn.dataset.priceRange;
      applyQuickPriceFilter(range);
    });
  });
  
  // 自定义价格筛选
  const applyPriceBtn = document.getElementById('applyPriceBtn');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  
  if (applyPriceBtn && minPriceInput && maxPriceInput) {
    applyPriceBtn.addEventListener('click', () => {
      const min = minPriceInput.value ? parseInt(minPriceInput.value) : null;
      const max = maxPriceInput.value ? parseInt(maxPriceInput.value) : null;
      
      // 清除快捷按钮选中状态
      document.querySelectorAll('.price-filter-btn').forEach(b => b.classList.remove('active'));
      
      applyPriceFilter(min, max);
    });
  }
  
  // 快捷数量筛选按钮
  document.querySelectorAll('.quantity-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quantity-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = btn.dataset.quantityRange;
      applyQuickQuantityFilter(range);
    });
  });
}
