# 实现指南 - 路由系统和日志系统

## 已完成的工作

### 1. 创建了日志系统 (`src/js/logger.js`)
- ✅ 将所有日志保存到内存中
- ✅ 支持导出日志到文件
- ✅ 提供日志过滤和统计功能
- ✅ 全局可访问 `window._logger` 和 `window._exportLogs()`

### 2. 创建了路由系统 (`src/js/router.js`)
- ✅ 支持前端路由如 `/backpack`, `/market` 等
- ✅ 浏览器前进/后退支持
- ✅ 路由与标签页的双向映射

### 3. 更新了 market.js
- ✅ 将所有 `console.log` 替换为 `log()`
- ✅ 将所有 `console.error` 替换为 `logError()`
- ✅ 将所有 `console.warn` 替换为 `logWarn()`
- ✅ **移除了市场登录限制** - 未登录用户也可以浏览市场

### 4. 创建了自动化测试页面 (`test-automation.html`)
- ✅ 实时监控游戏日志
- ✅ 自动运行测试用例
- ✅ 导出日志功能
- ✅ 日志统计和可视化

## 待完成的工作

### 手动步骤（需要修改 main.js）

由于文件编码问题，需要手动完成以下步骤：

#### 步骤 1: 在 main.js 开头添加导入

在 `import { state, saveGame, loadGame } from './state.js';` 这一行后面添加:

```javascript
import { log, logWarn, logError, logger } from './logger.js';
import { router, ROUTES, TAB_TO_ROUTE, ROUTE_TO_TAB } from './router.js';
```

#### 步骤 2: 修改标签页切换事件

找到 `initEvents()` 函数中的标签页切换部分，在 `btn.classList.add('active');` 后面添加:

```javascript
// 更新URL路由
const route = TAB_TO_ROUTE[tab] || '/';
router.navigate(route);
```

#### 步骤 3: 在 init() 函数末尾添加路由初始化

在 `init()` 函数的最后添加:

```javascript
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

setupRouter();
```

## 使用指南

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 打开自动化测试页面

在浏览器中打开: `http://localhost:3000/test-automation.html`

### 3. 使用测试面板

1. 点击"打开游戏"按钮 - 会在新窗口打开游戏
2. 点击"运行测试"按钮 - 自动运行测试用例
3. 查看日志和统计信息
4. 点击"导出日志"可以下载日志文件

### 4. 路由功能

现在可以直接访问：
- http://localhost:3000/ - 主页（游戏页面）
- http://localhost:3000/backpack - 背包页面
- http://localhost:3000/market - 市场页面
- http://localhost:3000/shop - 商店页面
- http://localhost:3000/upgrades - 升级页面
- http://localhost:3000/tasks - 任务页面
- http://localhost:3000/stats - 统计页面
- http://localhost:3000/settings - 设置页面

### 5. 日志系统使用

在浏览器控制台中：

```javascript
// 查看所有日志
window._logger.getLogs()

// 导出日志到文件
window._exportLogs()

// 查看日志统计
window._logger.getStats()

// 过滤日志
window._logger.filterLogs('ERROR') // 只看错误
window._logger.filterLogs(null, 'market') // 搜索关键词

// 清空日志
window._logger.clear()
```

## 市场功能更新

- ✅ **未登录用户可以浏览市场订单** - 不再强制要求登录
- ✅ 未登录时仍然可以查看市场统计、订单列表
- ⚠️ 创建订单和购买订单仍需要登录（这是正常的业务逻辑）

## 常见问题

### Q: 为什么 main.js 没有自动更新？
A: 由于文件编码问题，请手动按照上面的步骤进行修改。

### Q: 日志在哪里查看？
A: 使用 test-automation.html 页面实时查看，或者在浏览器控制台使用 `window._logger.getLogs()`

### Q: 如何导出日志给开发者？
A: 点击测试页面的"导出日志"按钮，或在控制台运行 `window._exportLogs()`

### Q: 路由不工作怎么办？
A: 确保已经完成 main.js 的手动修改步骤。

## 下一步

1. 手动完成 main.js 的修改
2. 重启开发服务器
3. 打开 test-automation.html 进行测试
4. 查看日志输出，排查任何问题
