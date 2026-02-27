# 🛒 市场交易功能 - 前端集成指南

**创建日期**: 2025-10-10  
**状态**: 🚧 进行中  
**完成度**: 40%

---

## ✅ 已完成

1. **市场 JavaScript 模块** (`src/js/market.js` - 521行)
   - ✅ API 调用函数
   - ✅ UI 渲染函数
   - ✅ 事件处理函数

2. **市场 CSS 样式** (`src/css/market.css` - 692行)
   - ✅ 订单卡片样式
   - ✅ 表单样式
   - ✅ 统计面板样式
   - ✅ 响应式设计

---

## 📋 待完成步骤

### 步骤 3: 更新配置文件

在 `src/js/config.js` 添加 API 配置：

```javascript
export const CONFIG = {
  // 现有配置...
  
  // 新增：API 配置
  API_BASE_URL: 'http://localhost:3001', // 开发环境
  // API_BASE_URL: 'https://your-api.workers.dev', // 生产环境
  
  // 市场配置
  MARKET: {
    FEE_RATE: 0.05,
    MIN_PRICE: 1,
    MAX_PRICE: 1000000,
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 999999
  }
};
```

### 步骤 4: 添加国际化翻译

在 `src/js/i18n.js` 添加市场相关翻译：

```javascript
export const i18n = {
  zh: {
    // 现有翻译...
    
    // 市场相关
    market: '市场',
    marketPlace: '市场广场',
    myOrders: '我的订单',
    transactions: '交易记录',
    createOrder: '创建订单',
    buyNow: '立即购买',
    cancel: '取消',
    seller: '卖家',
    quantity: '数量',
    totalPrice: '总价',
    unitPrice: '单价',
    fee: '手续费',
    activeOrders: '活跃订单',
    completedTrades: '完成交易',
    totalVolume: '总交易量',
    tradingFee: '交易手续费',
    noOrdersAvailable: '暂无订单',
    noMyOrders: '您还没有创建订单',
    noTransactions: '暂无交易记录',
    orderCreated: '订单创建成功',
    purchaseSuccess: '购买成功',
    orderCancelled: '订单已取消',
    insufficientInventory: '库存不足',
    insufficientCoins: '金币不足',
    orderNotAvailable: '订单已失效',
    cannotBuyOwnOrder: '不能购买自己的订单',
    invalidInput: '输入无效',
    tooManyOrders: '挂单数量已达上限',
    pleaseLogin: '请先登录',
    bought: '买入',
    sold: '卖出',
    from: '从',
    to: '给',
    status_open: '待售',
    status_sold: '已售',
    status_cancelled: '已取消',
    
    // 鸡蛋翻译
    egg_white: '白蛋',
    egg_brown: '棕蛋',
    egg_silver: '银蛋',
    egg_gold: '金蛋',
    egg_purple: '紫蛋',
    egg_black: '黑蛋',
  },
  en: {
    // 现有翻译...
    
    // 市场相关
    market: 'Market',
    marketPlace: 'Marketplace',
    myOrders: 'My Orders',
    transactions: 'Transactions',
    createOrder: 'Create Order',
    buyNow: 'Buy Now',
    cancel: 'Cancel',
    seller: 'Seller',
    quantity: 'Quantity',
    totalPrice: 'Total Price',
    unitPrice: 'Unit Price',
    fee: 'Fee',
    activeOrders: 'Active Orders',
    completedTrades: 'Completed Trades',
    totalVolume: 'Total Volume',
    tradingFee: 'Trading Fee',
    noOrdersAvailable: 'No orders available',
    noMyOrders: 'You have no orders yet',
    noTransactions: 'No transactions yet',
    orderCreated: 'Order created successfully',
    purchaseSuccess: 'Purchase successful',
    orderCancelled: 'Order cancelled',
    insufficientInventory: 'Insufficient inventory',
    insufficientCoins: 'Insufficient coins',
    orderNotAvailable: 'Order not available',
    cannotBuyOwnOrder: 'Cannot buy your own order',
    invalidInput: 'Invalid input',
    tooManyOrders: 'Too many orders',
    pleaseLogin: 'Please login first',
    bought: 'Bought',
    sold: 'Sold',
    from: 'from',
    to: 'to',
    status_open: 'Open',
    status_sold: 'Sold',
    status_cancelled: 'Cancelled',
    
    // 鸡蛋翻译
    egg_white: 'White Egg',
    egg_brown: 'Brown Egg',
    egg_silver: 'Silver Egg',
    egg_gold: 'Gold Egg',
    egg_purple: 'Purple Egg',
    egg_black: 'Black Egg',
  }
};
```

### 步骤 5: 添加HTML结构

在 `index.html` 的标签页导航中添加市场标签：

```html
<!-- 在现有标签页后添加 -->
<div class="tabs">
  <button class="tab-btn active" data-tab="main" data-i18n="tabMain">主界面</button>
  <button class="tab-btn" data-tab="inventory" data-i18n="tabInventory">背包</button>
  <button class="tab-btn" data-tab="shop" data-i18n="tabShop">商店</button>
  <button class="tab-btn" data-tab="upgrade" data-i18n="tabUpgrade">升级</button>
  <button class="tab-btn" data-tab="tasks" data-i18n="tabTasks">任务</button>
  
  <!-- 新增：市场标签 -->
  <button class="tab-btn" data-tab="market" data-i18n="market">市场</button>
  
  <button class="tab-btn" data-tab="settings" data-i18n="tabSettings">设置</button>
</div>
```

在 `<body>` 中添加市场内容区域（在设置界面之前）：

```html
<!-- 市场界面 -->
<div class="tab-content" data-content="market">
  <div class="market-container">
    <!-- 市场子标签 -->
    <div class="market-tabs">
      <button class="market-tab-btn active" data-market-tab="marketplace" data-i18n="marketPlace">市场广场</button>
      <button class="market-tab-btn" data-market-tab="my-orders" data-i18n="myOrders">我的订单</button>
      <button class="market-tab-btn" data-market-tab="transactions" data-i18n="transactions">交易记录</button>
    </div>

    <!-- 加载状态 -->
    <div id="marketLoading" class="market-loading" style="display: none;">
      <div class="loading-spinner"></div>
    </div>

    <!-- 市场广场标签页 -->
    <div class="market-tab-content active" data-market-content="marketplace">
      <!-- 市场统计 -->
      <div class="market-stats">
        <div id="marketStats"></div>
      </div>

      <!-- 创建订单区域 -->
      <div class="create-order-section">
        <h3 data-i18n="createOrder">创建订单</h3>
        <div class="create-order-form">
          <div class="form-group">
            <label data-i18n="rarity">稀有度</label>
            <select id="createOrderRarity">
              <option value="white" data-i18n="egg_white">白蛋</option>
              <option value="brown" data-i18n="egg_brown">棕蛋</option>
              <option value="silver" data-i18n="egg_silver">银蛋</option>
              <option value="gold" data-i18n="egg_gold">金蛋</option>
              <option value="purple" data-i18n="egg_purple">紫蛋</option>
              <option value="black" data-i18n="egg_black">黑蛋</option>
            </select>
          </div>
          <div class="form-group">
            <label data-i18n="quantity">数量</label>
            <input type="number" id="createOrderQuantity" min="1" placeholder="1" />
          </div>
          <div class="form-group">
            <label data-i18n="totalPrice">总价（金币）</label>
            <input type="number" id="createOrderPrice" min="1" placeholder="100" />
          </div>
          <div class="form-group">
            <button class="btn btn-primary" id="createOrderBtn" data-i18n="createOrder">创建订单</button>
          </div>
        </div>
        <div class="fee-preview" id="feePreview" style="display: none;">
          <strong data-i18n="fee">手续费</strong>: <span id="feeAmount">0</span> 💰 | 
          <strong data-i18n="youWillReceive">您将收到</strong>: <span id="receiveAmount">0</span> 💰
        </div>
      </div>

      <!-- 筛选和排序 -->
      <div class="market-controls">
        <div class="filter-buttons">
          <button class="filter-btn active" data-filter="all">全部</button>
          <button class="filter-btn" data-filter="white" data-i18n="egg_white">白蛋</button>
          <button class="filter-btn" data-filter="brown" data-i18n="egg_brown">棕蛋</button>
          <button class="filter-btn" data-filter="silver" data-i18n="egg_silver">银蛋</button>
          <button class="filter-btn" data-filter="gold" data-i18n="egg_gold">金蛋</button>
          <button class="filter-btn" data-filter="purple" data-i18n="egg_purple">紫蛋</button>
          <button class="filter-btn" data-filter="black" data-i18n="egg_black">黑蛋</button>
        </div>
        <div class="sort-controls">
          <select class="sort-select" id="sortBy">
            <option value="created_at">最新</option>
            <option value="price_coins">价格</option>
            <option value="quantity">数量</option>
          </select>
          <select class="sort-select" id="sortOrder">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>

      <!-- 订单列表 -->
      <div id="marketOrdersGrid" class="market-orders-grid"></div>
    </div>

    <!-- 我的订单标签页 -->
    <div class="market-tab-content" data-market-content="my-orders">
      <div id="myOrdersGrid" class="my-orders-list"></div>
    </div>

    <!-- 交易记录标签页 -->
    <div class="market-tab-content" data-market-content="transactions">
      <div id="transactionsGrid" class="transactions-list"></div>
    </div>
  </div>
</div>
```

在 `<head>` 中引入市场CSS：

```html
<head>
  <!-- 现有样式 -->
  <link rel="stylesheet" href="src/css/base.css" />
  <link rel="stylesheet" href="src/css/components.css" />
  <link rel="stylesheet" href="src/css/main.css" />
  <link rel="stylesheet" href="src/css/responsive.css" />
  
  <!-- 新增：市场样式 -->
  <link rel="stylesheet" href="src/css/market.css" />
</head>
```

### 步骤 6: 集成到主应用

在 `src/js/main.js` 添加市场模块：

```javascript
// 在文件顶部导入
import {
  initMarketUI,
  renderMarketOrders,
  renderMyOrders,
  renderTransactions,
  renderMarketStats,
  fetchMarketOrders,
  fetchMyOrders,
  fetchTransactions,
  createOrder,
  buyOrder,
  cancelOrder,
  handleFilterChange,
  handleSortChange
} from './market.js';

// 在 initEvents() 函数中添加市场事件
function initEvents() {
  // 现有事件...
  
  // 市场标签页切换
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
        renderMarketOrders();
        renderMarketStats();
      } else if (tab === 'my-orders') {
        await fetchMyOrders();
        renderMyOrders();
      } else if (tab === 'transactions') {
        await fetchTransactions();
        renderTransactions();
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
      renderMarketOrders();
    }
  });
  
  // 购买订单和取消订单（使用事件委托）
  document.body.addEventListener('click', async (e) => {
    const target = e.target;
    
    // 购买订单
    if (target.dataset.action === 'buy-order') {
      const orderId = target.dataset.orderId;
      if (await buyOrder(orderId)) {
        renderMarketOrders();
      }
    }
    
    // 取消订单
    if (target.dataset.action === 'cancel-order') {
      const orderId = target.dataset.orderId;
      if (await cancelOrder(orderId)) {
        renderMyOrders();
      }
    }
  });
  
  // 筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      handleFilterChange(btn.dataset.filter);
    });
  });
  
  // 排序选择
  document.getElementById('sortBy')?.addEventListener('change', (e) => {
    const sortBy = e.target.value;
    const sortOrder = document.getElementById('sortOrder').value;
    handleSortChange(sortBy, sortOrder);
  });
  
  document.getElementById('sortOrder')?.addEventListener('change', (e) => {
    const sortBy = document.getElementById('sortBy').value;
    const sortOrder = e.target.value;
    handleSortChange(sortBy, sortOrder);
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
      document.getElementById('feeAmount').textContent = fee;
      document.getElementById('receiveAmount').textContent = receive;
    } else {
      preview.style.display = 'none';
    }
  });
}

// 在 init() 函数中初始化市场（在主标签页切换到市场时）
document.querySelector('[data-tab="market"]')?.addEventListener('click', () => {
  initMarketUI();
});
```

---

## 🎯 完成后效果

完成以上步骤后，您将拥有：

- ✅ 完整的市场交易UI界面
- ✅ 市场订单浏览和筛选
- ✅ 创建卖单功能
- ✅ 购买订单功能
- ✅ 取消订单功能
- ✅ 我的订单管理
- ✅ 交易记录查看
- ✅ 市场统计展示
- ✅ 响应式设计（支持手机/平板/桌面）
- ✅ 中英文双语支持

---

## 📝 使用说明

### 创建订单
1. 选择要出售的鸡蛋稀有度
2. 输入数量和总价
3. 查看手续费预览
4. 点击"创建订单"

### 购买订单
1. 浏览市场订单列表
2. 使用筛选器按稀有度筛选
3. 点击订单的"立即购买"按钮

### 管理订单
1. 切换到"我的订单"标签页
2. 查看所有订单状态
3. 取消未售出的订单

---

## 🧪 测试清单

- [ ] 打开市场标签页
- [ ] 查看市场统计
- [ ] 筛选不同稀有度订单
- [ ] 排序订单（价格/时间）
- [ ] 创建测试订单
- [ ] 购买订单（用另一个账号）
- [ ] 取消订单
- [ ] 查看交易记录
- [ ] 测试响应式（手机/平板）
- [ ] 测试语言切换

---

## 🚀 下一步

1. 完成上述所有步骤
2. 测试所有功能
3. 连接实际后端API
4. 处理边界情况和错误
5. 优化用户体验

---

**文档版本**: 1.0  
**最后更新**: 2025-10-10  
**作者**: AI Assistant
