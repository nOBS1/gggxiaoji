/**
 * 金币记录模块
 * 提供金币变动记录的显示功能
 */

import { state } from './state.js';
import { t, i18n } from './i18n.js';

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // 1小时内显示"X分钟前"
  if (diffMins < 60) {
    return diffMins <= 0 ? t(i18n, state.language, 'justNow') || 'Just now' : `${diffMins} ${t(i18n, state.language, 'minutesAgo') || 'min ago'}`;
  }
  
  // 24小时内显示"X小时前"
  if (diffHours < 24) {
    return `${diffHours} ${t(i18n, state.language, 'hoursAgo') || 'h ago'}`;
  }
  
  // 7天内显示"X天前"
  if (diffDays < 7) {
    return `${diffDays} ${t(i18n, state.language, 'daysAgo') || 'd ago'}`;
  }
  
  // 超过7天显示具体日期
  return date.toLocaleDateString(state.language === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 渲染金币记录列表
 */
export function renderCoinHistory() {
  const container = document.getElementById('coinHistoryGrid');
  if (!container) {
    console.warn('[CoinHistory] Container not found');
    return;
  }

  if (!state.coinHistory || state.coinHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <p>${t(i18n, state.language, 'noCoinHistory')}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.coinHistory.map(entry => {
    const isPositive = entry.amount > 0;
    const typeKey = `coinType_${entry.type}`;
    const typeName = t(i18n, state.language, typeKey) || entry.type;
    
    return `
      <div class="coin-history-card ${isPositive ? 'positive' : 'negative'}">
        <div class="coin-history-icon">
          ${isPositive ? '📈' : '📉'}
        </div>
        <div class="coin-history-info">
          <div class="coin-history-header">
            <span class="coin-history-type">${typeName}</span>
            <span class="coin-history-amount ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '+' : ''}${entry.amount} 💰
            </span>
          </div>
          <div class="coin-history-details">
            <span class="coin-history-desc">${entry.description}</span>
            <span class="coin-history-time">${formatTime(entry.timestamp)}</span>
          </div>
          <div class="coin-history-balance">
            ${t(i18n, state.language, 'balance')}: ${entry.balance} 💰
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 初始化金币记录UI
 */
export function initCoinHistoryUI() {
  console.log('[CoinHistory] Initializing coin history UI...');
  renderCoinHistory();
}
