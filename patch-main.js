// 这个文件用于向 main.js 添加路由功能
// 将以下代码添加到 main.js 的导入部分后面

// ========== 添加到导入部分 ==========
/*
import { log, logWarn, logError, logger } from './logger.js';
import { router, ROUTES, TAB_TO_ROUTE, ROUTE_TO_TAB } from './router.js';
*/

// ========== 添加到 initEvents 函数中的标签页切换部分 ==========
/*
// 标签页切换
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const previousTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelector(`[data-content="${tab}"]`).classList.add('active');
    
    // 更新URL路由
    const route = TAB_TO_ROUTE[tab] || '/';
    router.navigate(route);
    
    // 如果离开市场标签，停止自动刷新
    if (previousTab === 'market' && tab !== 'market') {
      stopAutoRefresh();
    }
    
    // 如果是市场标签页，初始化市场UI并启动自动刷新
    if (tab === 'market') {
      await initMarketUI();
      startAutoRefresh();
    }
    
    updateAllDisplays();
  });
});
*/

// ========== 添加到 init 函数末尾 ==========
/*
// 初始化路由系统
function setupRouter() {
  // 注册路由处理器
  Object.keys(ROUTE_TO_TAB).forEach(route => {
    router.register(route, (path) => {
      const tab = ROUTE_TO_TAB[path];
      if (tab) {
        const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (tabBtn && !tabBtn.classList.contains('active')) {
          tabBtn.click();
        }
      }
    });
  });
  
  // 初始化当前路由
  router.init();
}

// 在 init() 函数末尾调用
setupRouter();
*/
