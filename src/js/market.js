/**
 * 市场交易模块
 * 提供玩家之间买卖鸡蛋的功能
 */

import { state, saveGame } from './state.js';
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
};

// ==================== API 调用函数 ====================

/**
 * 获取市场订单列表
 */
export async function fetchMarketOrders(rarity = null, sortBy = 'created_at', sortOrder = 'desc', limit = 20, offset = 0) {
  const token = getAuthToken();
  if (!token) {
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'pleaseLogin'));
    return null;
  }

  try {
    marketState.isLoading = true;
    updateLoadingState(true);

    let url = `${CONFIG.API_BASE_URL}/market/orders?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${limit}&offset=${offset}`;
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
      marketState.orders = result.data.orders || [];
      console.log('[Market] Fetched orders:', marketState.orders.length, 'Filter:', rarity);
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
      const errorMsg = getErrorMessage(result.error?.code) || result.error?.message || 'Failed to create order';
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

    if (result.success) {
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, t(i18n, state.language, 'purchaseSuccess'), 'success');
      
      // 刷新市场订单和交易记录
      await fetchMarketOrders(marketState.currentFilter, marketState.currentSort, marketState.currentSortOrder);
      await fetchTransactions();
      
      return true;
    } else {
      const errorMsg = getErrorMessage(result.error?.code) || result.error?.message || 'Failed to buy order';
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
      
      // 刷新我的订单
      await fetchMyOrders();
      await fetchMarketOrders(marketState.currentFilter, marketState.currentSort, marketState.currentSortOrder);
      
      return true;
    } else {
      const errorMsg = getErrorMessage(result.error?.code) || result.error?.message || 'Failed to cancel order';
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
 * 渲染我的订单
 */
export function renderMyOrders() {
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
  
  container.innerHTML = `
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
function getErrorMessage(errorCode) {
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
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(state.language === 'zh' ? 'zh-CN' : 'en-US');
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

// ==================== 事件处理 ====================

/**
 * 处理筛选变更
 */
export function handleFilterChange(rarity) {
  console.log('[Market] Filter changed to:', rarity);
  marketState.currentFilter = rarity;
  return fetchMarketOrders(rarity, marketState.currentSort, marketState.currentSortOrder);
}

/**
 * 处理排序变更
 */
export function handleSortChange(sortBy, sortOrder) {
  marketState.currentSort = sortBy;
  marketState.currentSortOrder = sortOrder;
  return fetchMarketOrders(marketState.currentFilter, sortBy, sortOrder);
}

/**
 * 初始化市场UI
 */
export async function initMarketUI() {
  console.log('[Market] Initializing market UI...');
  
  // 加载市场数据
  await Promise.all([
    fetchMarketOrders(marketState.currentFilter, marketState.currentSort, marketState.currentSortOrder),
    fetchMarketStats()
  ]);

  renderMarketOrders();
  renderMarketStats();
}
