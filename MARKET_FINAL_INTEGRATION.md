# 🎯 市场功能 - 最终集成代码

## ✅ 已完成
- ✅ `src/js/market.js` - 市场模块
- ✅ `src/css/market.css` - 样式
- ✅ `src/js/config.js` - 配置（已更新）
- ✅ `src/js/i18n.js` - 翻译（已更新）

## 📝 剩余步骤

### 步骤 1: 在 index.html 的 `<head>` 中添加市场CSS

在现有CSS后添加：

```html
<link rel="stylesheet" href="src/css/market.css" />
```

完整示例：
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

### 步骤 2: 在 index.html 的标签页导航中添加市场标签

找到 `<div class="tabs">` 部分，在"任务"和"设置"之间添加：

```html
<button class="tab-btn" data-tab="market" data-i18n="market">🛒 市场</button>
```

完整示例：
```html
<div class="tabs">
  <button class="tab-btn active" data-tab="main" data-i18n="tabMain">主界面</button>
  <button class="tab-btn" data-tab="inventory" data-i18n="tabInventory">背包</button>
  <button class="tab-btn" data-tab="shop" data-i18n="tabShop">商店</button>
  <button class="tab-btn" data-tab="upgrade" data-i18n="tabUpgrade">升级</button>
  <button class="tab-btn" data-tab="tasks" data-i18n="tabTasks">任务</button>
  <button class="tab-btn" data-tab="market" data-i18n="market">🛒 市场</button> <!-- 新增 -->
  <button class="tab-btn" data-tab="settings" data-i18n="tabSettings">设置</button>
</div>
```

### 步骤 3: 在 index.html 中添加市场内容区域

在"设置界面"（`data-content="settings"`）**之前**添加整个市场界面：

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

### 步骤 4: 在 src/js/main.js 中添加市场模块

#### 4.1 在文件顶部导入市场模块

在现有导入后添加：

```javascript
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
```

#### 4.2 在 initEvents() 函数中添加市场事件

在函数内部（任意位置，建议放在最后）添加：

```javascript
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
    document.getElementById('feeAmount').textContent = fee;
    document.getElementById('receiveAmount').textContent = receive;
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
```

#### 4.3 添加购买和取消订单的事件委托

在 body.addEventListener('click', ...) 的现有事件委托中添加：

```javascript
document.body.addEventListener('click', async (e) => {
  const target = e.target;
  
  // 现有的处理代码...
  
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
```

#### 4.4 初始化市场（当打开市场标签页时）

在主标签页切换事件中，找到处理 'market' 标签的地方，添加初始化逻辑。如果没有单独处理，可以添加：

```javascript
// 主标签页切换（已有的代码）
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // ...现有代码...
    const tab = btn.dataset.tab;
    
    // 新增：如果是市场标签页，初始化市场UI
    if (tab === 'market') {
      initMarketUI();
    }
  });
});
```

---

## ✅ 完成后测试清单

1. [ ] 刷新页面，查看是否有JavaScript错误
2. [ ] 点击"🛒 市场"标签页，检查UI是否正常显示
3. [ ] 查看市场统计卡片
4. [ ] 测试稀有度筛选按钮
5. [ ] 测试排序功能
6. [ ] 尝试创建订单（查看手续费预览）
7. [ ] 切换到"我的订单"和"交易记录"标签
8. [ ] 测试语言切换（中英文）
9. [ ] 测试响应式（调整浏览器窗口大小）

---

## 🔧 故障排查

### 问题1: 市场标签页点击没反应
**解决**: 检查 `main.js` 是否正确导入了 market.js

### 问题2: 样式错乱
**解决**: 确认 `market.css` 已在 `<head>` 中引入

### 问题3: 翻译未生效
**解决**: 刷新页面，确保 i18n.js 已更新

### 问题4: API调用失败
**解决**: 
- 检查 config.js 中的 API_BASE_URL 是否正确
- 确保后端API服务器正在运行
- 检查浏览器控制台的网络错误

---

## 📊 集成完成度

当前进度：**85%**

- [x] JavaScript 模块 (521行)
- [x] CSS 样式 (692行)
- [x] 配置文件更新
- [x] 国际化翻译
- [ ] HTML 结构 (待添加)
- [ ] main.js 事件绑定 (待添加)

**剩余工作**：复制上述代码片段到相应文件即可！

---

**创建日期**: 2025-10-10  
**版本**: Final Integration Guide
