/**
 * 主入口文件
 * 初始化游戏并绑定所有事件
 */

import '../css/main.css';
import { CONFIG } from './config.js';
import { i18n, t } from './i18n.js';
import { state, saveGame, loadGame } from './state.js';
import { MergeManager } from './merge/mergeManager.js';
import { 
  handleClick,
  sellEgg,
  doUpgrade,
  claimTask,
  watchAd,
  processPassiveIncome,
  calculateOfflineEarnings,
  resetGame,
  initAudio
} from './gameLogic.js';
import { updateAllDisplays, showFloatText } from './ui.js';
import {
  initMarketUI,
  renderMarketOrders,
  renderMyOrders,
  renderTransactions,
  renderMarketStats,
  fetchMarketOrders,
  fetchMyOrders,
  fetchTransactions,
  fetchMarketStats,
  createOrder,
  buyOrder,
  cancelOrder,
  handleFilterChange,
  handleSortChange,
  startAutoRefresh,
  stopAutoRefresh
} from './market.js';
import { renderCoinHistory } from './coinHistory.js';
import { router, ROUTES, getRouteByTab } from './router.js';
import { initGuestAuth } from './guest-auth.js';

// ==================== 初始化 ====================

function init() {
  console.log('🐔 小鸡生蛋 v4.0 - 数字合成版 加载中...');
  
  // 初始化游客系统（自动创建匿名账号）
  const guestInfo = initGuestAuth();
  console.log('✅ 游客登录成功:', guestInfo.nickname);
  
  // 加载游戏数据
  loadGame();
  
  // 计算离线收益
  const offlineEggs = calculateOfflineEarnings();
  if (offlineEggs > 0) {
    showFloatText(
      window.innerWidth / 2,
      window.innerHeight / 2,
      `${t(i18n, state.language, 'offlineEarned')} ${offlineEggs} 🥚`
    );
  }
  
  // 初始化UI
  updateAllDisplays();
  
  // 初始化合成游戏
  initMergeGame();
  
  // 绑定事件
  initEvents();
  setupRouting();
  
  // 启动被动产蛋定时器
  startPassiveIncome();
  
  // 启动广告冷却定时器
  startAdCooldown();
  
  // 定期自动保存
  setInterval(saveGame, 10000);
  
  // 初始化音效开关状态
  const soundToggle = document.getElementById('soundToggle');
  if (!state.soundEnabled && soundToggle) {
    soundToggle.classList.remove('active');
  }
  
  console.log('✅ 游戏加载完成！');
}

// ==================== 事件绑定 ====================

async function activateTab(tabName) {
  const targetTab = tabName || 'main';
  const previousTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  const tabButton = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
  const tabContent = document.querySelector(`.tab-content[data-content="${targetTab}"]`);

  if (!tabButton || !tabContent) {
    if (targetTab !== 'main') {
      return activateTab('main');
    }
    console.warn('[UI] 无法找到标签页:', targetTab);
    return;
  }

  if (previousTab === 'market' && targetTab !== 'market') {
    stopAutoRefresh();
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn === tabButton);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content === tabContent);
  });

  if (targetTab === 'market') {
    await initMarketUI();
    startAutoRefresh();
  }

  updateAllDisplays();
}

function initEvents() {
  // 标签页切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      const route = getRouteByTab(tab) || ROUTES.HOME;
      router.navigate(route);
    });
  });
  
  // 点击小鸡（仅当元素存在时）
  const chickenContainer = document.getElementById('chickenContainer');
  if (chickenContainer) {
    chickenContainer.addEventListener('click', (e) => {
      // 首次点击时初始化音效系统
      initAudio();
      
      handleClick(e.clientX, e.clientY);
      updateAllDisplays();
    });
  }
  
  // 键盘支持（空格键和回车键）
  document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !state.isKeyPressed) {
      e.preventDefault();
      state.isKeyPressed = true;
      
      // 模拟点击事件
      handleClick(window.innerWidth / 2, window.innerHeight / 2);
      updateAllDisplays();
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      state.isKeyPressed = false;
    }
  });
  
  // 使用事件委托处理动态生成的按钮
  document.body.addEventListener('click', async (e) => {
    const target = e.target;
    
    // 处理卖出按钮
    if (target.dataset.action === 'sell') {
      const rarity = target.dataset.rarity;
      const amount = parseInt(target.dataset.amount);
      if (sellEgg(rarity, amount)) {
        updateAllDisplays();
      }
    }
    
    // 处理升级按钮
    if (target.dataset.action === 'upgrade') {
      const key = target.dataset.key;
      if (doUpgrade(key)) {
        updateAllDisplays();
      }
    }
    
    // 处理任务领取按钮
    if (target.dataset.action === 'claim-task') {
      const taskId = target.dataset.task;
      if (claimTask(taskId)) {
        updateAllDisplays();
      }
    }
    
    // 购买订单
    if (target.dataset.action === 'buy-order') {
      const orderId = target.dataset.orderId;
      if (await buyOrder(orderId)) {
        // buyOrder 已经更新了本地状态，直接刷新显示
        updateAllDisplays();
        renderMarketOrders();
      }
    }
    
    // 取消订单
    if (target.dataset.action === 'cancel-order') {
      const orderId = target.dataset.orderId;
      if (await cancelOrder(orderId)) {
        // cancelOrder 已经更新了本地状态，直接刷新显示
        updateAllDisplays();
        renderMyOrders();
      }
    }
  });
  
  // 广告按钮
  const watchAdBtn = document.getElementById('watchAdBtn');
  watchAdBtn.addEventListener('click', () => {
    // 先检查是否可以观看
    const success = watchAd(() => {
      updateAllDisplays();
    });
    
    // 只有成功时才禁用按钮
    if (success) {
      watchAdBtn.disabled = true;
      watchAdBtn.textContent = t(i18n, state.language, 'adPlaying');
    } else {
      // 失败时显示原因
      if (state.adCooldown > 0) {
        showFloatText(window.innerWidth / 2, window.innerHeight / 2, `冷却中: ${state.adCooldown}秒`);
      } else if (state.adWatchedToday >= CONFIG.AD_DAILY_LIMIT) {
        showFloatText(window.innerWidth / 2, window.innerHeight / 2, '今日观看次数已达上限！');
      }
    }
  });
  
  // 音效开关
  const soundToggle = document.getElementById('soundToggle');
  soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggle.classList.toggle('active');
    saveGame();
  });
  
  // 语言切换
  const langToggle = document.getElementById('langToggle');
  langToggle.addEventListener('click', () => {
    state.language = state.language === 'zh' ? 'en' : 'zh';
    
    // 重新渲染合成游戏界面（如果存在）
    if (mergeGameInstance) {
      mergeGameInstance.render();
      mergeGameInstance.renderTiles();
      mergeGameInstance.updateSessionStats();
    }
    
    updateAllDisplays();
    saveGame();
  });
  
  
  // 重置游戏
  const resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', () => {
    const confirmed = confirm(t(i18n, state.language, 'resetConfirm'));
    if (confirmed) {
      resetGame();
    }
  });
  
  // 联系我们邮件混淆处理
  const contactLink = document.getElementById('contactLink');
  if (contactLink) {
    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
      // 混淆邮箱地址
      const u = 'weixinyongjiu';
      const d = 'gmail';
      const c = 'com';
      window.location.href = `mailto:${u}@${d}.${c}`;
    });
  }
  
  // 公告关闭
  const closeAnnouncement = document.getElementById('closeAnnouncement');
  const announcementBanner = document.getElementById('announcementBanner');
  
  // 检查是否已关闭公告
  const announcementClosed = localStorage.getItem('announcement_v2.1_closed');
  if (announcementClosed === 'true' && announcementBanner) {
    announcementBanner.classList.add('hidden');
  }
  
  if (closeAnnouncement) {
    closeAnnouncement.addEventListener('click', () => {
      if (announcementBanner) {
        announcementBanner.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
          announcementBanner.classList.add('hidden');
          localStorage.setItem('announcement_v2.1_closed', 'true');
        }, 300);
      }
    });
  }
  
  // 页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const offlineEggs = calculateOfflineEarnings();
      if (offlineEggs > 0) {
        showFloatText(
          window.innerWidth / 2,
          window.innerHeight / 2,
          `${t(i18n, state.language, 'offlineEarned')} +${offlineEggs}🥚`
        );
      }
      updateAllDisplays();
    }
  });
  
  // ==================== 市场交易事件 ====================
  
  // 市场子标签页切换
  document.querySelectorAll('.market-tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.market-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.market-tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tab = btn.dataset.marketTab;
      document.querySelector(`[data-market-content="${tab}"]`).classList.add('active');
      
      // 加载对应数据
      if (tab === 'marketplace') {
        await fetchMarketOrders();
        await fetchMarketStats();  // 确保先获取统计数据
        renderMarketOrders();
        renderMarketStats();
      } else if (tab === 'my-orders') {
        await fetchMyOrders();
        renderMyOrders();
      } else if (tab === 'transactions') {
        await fetchTransactions();
        renderTransactions();
      } else if (tab === 'coin-history') {
        renderCoinHistory();
      }
    });
  });
  
  // 创建订单
  const createOrderBtn = document.getElementById('createOrderBtn');
  createOrderBtn?.addEventListener('click', async () => {
    const rarity = document.getElementById('createOrderRarity').value;
    const quantity = parseInt(document.getElementById('createOrderQuantity').value);
    const price = parseInt(document.getElementById('createOrderPrice').value);
    
    if (await createOrder(rarity, quantity, price)) {
      // 清空表单
      document.getElementById('createOrderQuantity').value = '';
      document.getElementById('createOrderPrice').value = '';
      document.getElementById('feePreview').style.display = 'none';
      renderMarketOrders();
    }
  });
  
  // 手续费预览
  const priceInput = document.getElementById('createOrderPrice');
  priceInput?.addEventListener('input', (e) => {
    const price = parseInt(e.target.value) || 0;
    const fee = Math.floor(price * 0.05);
    const receive = price - fee;
    
    const preview = document.getElementById('feePreview');
    if (price > 0) {
      preview.style.display = 'block';
      document.getElementById('listingPrice').textContent = `${price} 💰`;
      document.getElementById('feeAmount').textContent = `${fee} 💰`;
      document.getElementById('receiveAmount').textContent = `${receive} 💰`;
    } else {
      preview.style.display = 'none';
    }
  });
  
  // 筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await handleFilterChange(btn.dataset.filter);
      renderMarketOrders();
    });
  });
  
  // 排序选择
  document.getElementById('sortBy')?.addEventListener('change', async (e) => {
    const sortBy = e.target.value;
    const sortOrder = document.getElementById('sortOrder').value;
    await handleSortChange(sortBy, sortOrder);
    renderMarketOrders();
  });
  
  document.getElementById('sortOrder')?.addEventListener('change', async (e) => {
    const sortBy = document.getElementById('sortBy').value;
    const sortOrder = e.target.value;
    await handleSortChange(sortBy, sortOrder);
    renderMarketOrders();
  });
}

function setupRouting() {
  const routeTabPairs = [
    [ROUTES.HOME, 'main'],
    [ROUTES.BACKPACK, 'inventory'],
    [ROUTES.SHOP, 'shop'],
    [ROUTES.MARKET, 'market'],
    [ROUTES.UPGRADE, 'upgrade'],
    [ROUTES.UPGRADES, 'upgrade'],
    [ROUTES.TASKS, 'tasks'],
    [ROUTES.SETTINGS, 'settings']
  ];

  routeTabPairs.forEach(([route, tab]) => {
    if (!route || !tab) return;
    router.register(route, () => activateTab(tab));
  });

  router.init();
}

// ==================== 合成游戏初始化 ====================

let mergeGameInstance = null;

function initMergeGame() {
  const container = document.getElementById('mergeGameContainer');
  if (!container) {
    console.warn('[MergeGame] 容器未找到，跳过初始化');
    return;
  }
  
  try {
    mergeGameInstance = new MergeManager(container);
    console.log('✅ 合成游戏初始化完成');
  } catch (error) {
    console.error('❌ 合成游戏初始化失败:', error);
  }
}

// ==================== 定时器 ====================

function startPassiveIncome() {
  setInterval(() => {
    // 检查是否跨日，自动重置任务和广告
    checkDailyReset();
    
    const eggsAdded = processPassiveIncome();
    
    if (eggsAdded > 0) {
      showFloatText(
        window.innerWidth / 2,
        100,
        `${t(i18n, state.language, 'auto')} +${eggsAdded} 🥚`
      );
      updateAllDisplays();
    }
    
    saveGame();
  }, 1000); // 每秒检查一次
}

// 检查跨日重置
function checkDailyReset() {
  const today = new Date().toDateString();
  if (state.lastAdDate !== today) {
    console.log('⚠️ 检测到跨日，重置每日任务和广告计数');
    state.adWatchedToday = 0;
    state.dailyTasks = {
      clicks: 0,
      sellSilver: 0,
      clickTaskClaimed: false,
      sellTaskClaimed: false
    };
    state.lastAdDate = today;
    updateAllDisplays();  // 更新 UI 显示
    saveGame();
  }
}

function startAdCooldown() {
  setInterval(() => {
    if (state.adCooldown > 0) {
      state.adCooldown--;
      
      const cooldownEl = document.getElementById('adCooldown');
      if (cooldownEl) {
        cooldownEl.textContent = state.adCooldown;
      }
      
      const watchAdBtn = document.getElementById('watchAdBtn');
      if (state.adCooldown === 0 && watchAdBtn) {
        watchAdBtn.disabled = false;
        watchAdBtn.innerHTML = t(i18n, state.language, 'watchAd');
      }
    }
  }, 1000);
}

// ==================== 启动游戏 ====================

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
