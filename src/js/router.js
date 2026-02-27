/**
 * 前端路由系统
 * 支持页面路由如 /backpack、/market 等
 */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;

    // 监听浏览器前进后退
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
  }

  /**
   * 注册路由
   */
  register(path, callback) {
    this.routes.set(path, callback);
  }

  /**
   * 导航到指定路由
   */
  navigate(path) {
    if (this.currentRoute !== path) {
      window.history.pushState({}, '', path);
      this.handleRoute(path);
    }
  }

  /**
   * 处理路由变化
   */
  handleRoute(path) {
    const normalizedPath =
      path !== '/' ? path.replace(/\/+$/, '') || '/' : path;
    console.log('[Router] Navigating to:', normalizedPath);
    this.currentRoute = normalizedPath;

    // 查找匹配的路由
    let handler = this.routes.get(normalizedPath);

    // 如果没有精确匹配，查找根路由
    if (!handler) {
      handler = this.routes.get('/');
    }

    if (handler) {
      // 允许异步处理路由，捕获异常避免中断
      Promise.resolve(handler(normalizedPath)).catch(err => {
        console.error('[Router] Route handler error:', err);
      });
    } else {
      console.warn('[Router] No handler for route:', path);
    }
  }

  /**
   * 初始化路由
   */
  init() {
    this.handleRoute(window.location.pathname);
  }
}

// 创建全局路由实例
export const router = new Router();

// 路由配置
export const ROUTES = {
  HOME: '/',
  BACKPACK: '/backpack',
  SHOP: '/shop',
  MARKET: '/market',
  UPGRADE: '/upgrade',
  UPGRADES: '/upgrades',
  TASKS: '/tasks',
  STATS: '/stats',
  SETTINGS: '/settings'
};

// 路由与标签页的映射
export const ROUTE_TO_TAB = {
  '/': 'main',
  '/backpack': 'inventory',
  '/shop': 'shop',
  '/market': 'market',
  '/upgrade': 'upgrade',
  '/upgrades': 'upgrade',
  '/tasks': 'tasks',
  '/stats': 'stats',
  '/settings': 'settings'
};

// 标签页与路由的映射
export const TAB_TO_ROUTE = {
  main: '/',
  inventory: '/backpack',
  shop: '/shop',
  market: '/market',
  upgrade: '/upgrade',
  tasks: '/tasks',
  stats: '/stats',
  settings: '/settings'
};

/**
 * 根据路径获取对应的标签页名称
 */
export function getTabByRoute(path) {
  return ROUTE_TO_TAB[path];
}

/**
 * 根据标签页名称获取对应的路径
 */
export function getRouteByTab(tab) {
  return TAB_TO_ROUTE[tab];
}
