# 🐔 小鸡生蛋 v4.5 - 股票市场功能设计

## 📋 参考的模拟股市游戏

### 经典股市模拟游戏分析

#### 1. **Wall Street Survivor** / **Investopedia Stock Simulator**
- **核心机制**：真实股票数据 + 虚拟货币
- **特点**：
  - 实时/延迟价格数据
  - 买入/卖出操作
  - 排行榜系统
  - 投资组合管理

#### 2. **Stock Market Game (SMG)**
- **核心机制**：教育导向的股市模拟
- **特点**：
  - 简化的交易界面
  - 市场新闻事件
  - 团队竞赛模式

#### 3. **AdVenture Capitalist** 放置类股市游戏
- **核心机制**：放置 + 投资增长
- **特点**：
  - 自动收益
  - 投资倍增器
  - 里程碑奖励
  - 重置机制（天使投资人）

#### 4. **Idle Stock Market Tycoon**
- **核心机制**：放置 + 股票买卖
- **特点**：
  - 简化的 K 线图
  - 自动交易 AI
  - 股票分红
  - 公司升级系统

---

## 🎮 小鸡生蛋股票市场设计方案

### 设计理念
将"蛋"的稀有度与"股票"概念结合，创造一个**蛋类股票市场**：
- 每种稀有度的蛋都有对应的"股票"
- 股价受市场供需、游戏事件影响
- 玩家可以投资蛋类股票获取收益

---

## 📊 核心功能模块

### 1. 蛋类股票系统

#### 股票种类（6种）
```javascript
const EGG_STOCKS = {
  WHITE: {
    name: '白蛋股票',
    symbol: 'WHITE',
    nameEn: 'White Egg Stock',
    initialPrice: 10,      // 初始价格（金币）
    volatility: 0.05,      // 波动率（5%）
    dividendRate: 0.01,    // 分红率（1%/天）
  },
  BROWN: {
    name: '棕蛋股票',
    symbol: 'BROWN',
    nameEn: 'Brown Egg Stock',
    initialPrice: 50,
    volatility: 0.08,
    dividendRate: 0.02,
  },
  SILVER: {
    name: '银蛋股票',
    symbol: 'SILVER',
    nameEn: 'Silver Egg Stock',
    initialPrice: 200,
    volatility: 0.12,
    dividendRate: 0.03,
  },
  GOLD: {
    name: '金蛋股票',
    symbol: 'GOLD',
    nameEn: 'Gold Egg Stock',
    initialPrice: 1000,
    volatility: 0.15,
    dividendRate: 0.05,
  },
  PURPLE: {
    name: '紫蛋股票',
    symbol: 'PURPLE',
    nameEn: 'Purple Egg Stock',
    initialPrice: 5000,
    volatility: 0.20,
    dividendRate: 0.08,
  },
  BLACK: {
    name: '黑蛋股票',
    symbol: 'BLACK',
    nameEn: 'Black Egg Stock',
    initialPrice: 20000,
    volatility: 0.30,
    dividendRate: 0.10,
  },
};
```

#### 特点
- **低稀有度**：价格低、波动小、分红少、风险低
- **高稀有度**：价格高、波动大、分红多、风险高

---

### 2. 股价波动机制

#### A. 基础波动（随机）
```javascript
// 每小时更新一次股价
function updateStockPrice(stock) {
  const randomFactor = (Math.random() - 0.5) * 2; // -1 到 1
  const priceChange = stock.currentPrice * stock.volatility * randomFactor;
  
  stock.currentPrice += priceChange;
  stock.currentPrice = Math.max(stock.currentPrice, stock.initialPrice * 0.1); // 最低跌至 10%
  
  return stock.currentPrice;
}
```

#### B. 市场事件影响
```javascript
const MARKET_EVENTS = [
  {
    id: 'egg_boom',
    nameZh: '产蛋热潮',
    nameEn: 'Egg Production Boom',
    effect: { WHITE: +0.15, BROWN: +0.10, SILVER: +0.05 },
    probability: 0.05, // 5% 概率触发
    duration: 24, // 持续 24 小时
  },
  {
    id: 'rare_shortage',
    nameZh: '稀有蛋短缺',
    nameEn: 'Rare Egg Shortage',
    effect: { PURPLE: +0.30, BLACK: +0.50 },
    probability: 0.03,
    duration: 48,
  },
  {
    id: 'market_crash',
    nameZh: '市场崩盘',
    nameEn: 'Market Crash',
    effect: { ALL: -0.25 }, // 所有股票下跌 25%
    probability: 0.02,
    duration: 12,
  },
  {
    id: 'gold_rush',
    nameZh: '金蛋热潮',
    nameEn: 'Gold Egg Rush',
    effect: { GOLD: +0.40, SILVER: +0.20 },
    probability: 0.04,
    duration: 36,
  },
];
```

#### C. 供需影响
- 玩家在**交易市场**出售的蛋数量越多 → 对应股票价格下跌
- 玩家购买蛋数量越多 → 对应股票价格上涨

```javascript
function adjustPriceBySupplyDemand(rarity, netSupply) {
  // netSupply > 0: 卖出多，价格下跌
  // netSupply < 0: 买入多，价格上涨
  const impact = -netSupply * 0.001; // 每 1000 个蛋影响 0.1%
  return Math.max(-0.05, Math.min(0.05, impact)); // 限制在 ±5%
}
```

---

### 3. 交易功能

#### 买入股票
```typescript
interface BuyStockRequest {
  symbol: string;        // 股票代码（'WHITE', 'BROWN' 等）
  quantity: number;      // 购买数量
  totalCost: number;     // 总成本（包括手续费）
}

interface BuyStockResponse {
  success: boolean;
  data: {
    transaction: {
      id: string;
      symbol: string;
      quantity: number;
      pricePerShare: number;
      totalCost: number;
      fee: number;        // 交易手续费（1%）
      timestamp: number;
    };
    portfolio: StockPortfolio;
  };
}
```

#### 卖出股票
```typescript
interface SellStockRequest {
  symbol: string;
  quantity: number;
}

interface SellStockResponse {
  success: boolean;
  data: {
    transaction: {
      id: string;
      symbol: string;
      quantity: number;
      pricePerShare: number;
      totalRevenue: number;
      profit: number;     // 盈亏
      profitRate: number; // 盈亏率（%）
    };
  };
}
```

---

### 4. 投资组合管理

#### 玩家持仓
```typescript
interface StockHolding {
  symbol: string;
  quantity: number;
  averageCost: number;      // 平均成本
  currentPrice: number;     // 当前价格
  totalValue: number;       // 总价值
  profit: number;           // 浮动盈亏
  profitRate: number;       // 盈亏率（%）
}

interface StockPortfolio {
  totalInvestment: number;  // 总投资金额
  currentValue: number;     // 当前市值
  totalProfit: number;      // 总盈亏
  totalProfitRate: number;  // 总盈亏率
  holdings: StockHolding[]; // 持仓列表
  dividends: number;        // 累计分红
}
```

---

### 5. 股息分红系统

#### 每日分红
```javascript
// 每天 UTC 00:00 自动发放分红
async function distributeDividends() {
  const allHoldings = await getAllStockHoldings();
  
  for (const holding of allHoldings) {
    const stock = EGG_STOCKS[holding.symbol];
    const dividend = holding.quantity * stock.currentPrice * stock.dividendRate;
    
    // 发放分红金币
    await addCoins(holding.userId, dividend, 'STOCK_DIVIDEND');
    
    // 记录分红历史
    await recordDividend({
      userId: holding.userId,
      symbol: holding.symbol,
      quantity: holding.quantity,
      amount: dividend,
      date: new Date(),
    });
  }
}
```

---

### 6. K 线图展示

#### 简化的蜡烛图
```javascript
interface Candlestick {
  timestamp: number;
  open: number;    // 开盘价
  high: number;    // 最高价
  low: number;     // 最低价
  close: number;   // 收盘价
  volume: number;  // 成交量
}

// 时间周期
const TIME_PERIODS = {
  '1H': 3600000,      // 1小时
  '4H': 14400000,     // 4小时
  '1D': 86400000,     // 1天
  '1W': 604800000,    // 1周
};
```

#### 技术指标
- **移动平均线（MA）**：7日、30日
- **涨跌幅**：24小时、7天
- **成交量**：显示买卖活跃度

---

### 7. 市场信息面板

#### 实时行情
```javascript
interface MarketOverview {
  timestamp: number;
  stocks: {
    symbol: string;
    name: string;
    currentPrice: number;
    change24h: number;        // 24小时涨跌
    changeRate24h: number;    // 24小时涨跌幅（%）
    volume24h: number;        // 24小时成交量
    marketCap: number;        // 市值（所有玩家持仓总值）
    high24h: number;
    low24h: number;
  }[];
  activeEvents: MarketEvent[]; // 当前活跃的市场事件
}
```

---

### 8. 排行榜系统

#### 投资收益排行
```typescript
interface StockLeaderboard {
  daily: {
    userId: string;
    nickname: string;
    profitRate: number;    // 今日收益率
    totalProfit: number;   // 今日盈利
  }[];
  weekly: { /* 同上 */ }[];
  allTime: { /* 同上 */ }[];
}
```

---

## 🎨 UI/UX 设计

### 页面结构

#### 1. 股票市场主页
```
┌─────────────────────────────────────┐
│  📊 蛋类股票市场                    │
├─────────────────────────────────────┤
│  💰 我的投资组合                    │
│  ├─ 总资产：10,000 金币             │
│  ├─ 持仓市值：8,500 金币            │
│  ├─ 盈亏：+500 (+6.25%)  🟢        │
│  └─ 累计分红：120 金币              │
├─────────────────────────────────────┤
│  🔥 热门股票                        │
│  ┌───────┬────────┬──────┬────────┐│
│  │ 代码  │ 价格   │ 涨跌 │ 操作   ││
│  ├───────┼────────┼──────┼────────┤│
│  │ BLACK │ 25,600 │ +8%🔥│ 买/卖  ││
│  │ PURPLE│ 5,200  │ +3%  │ 买/卖  ││
│  │ GOLD  │ 980    │ -2%  │ 买/卖  ││
│  │ SILVER│ 195    │ +1%  │ 买/卖  ││
│  │ BROWN │ 52     │ -1%  │ 买/卖  ││
│  │ WHITE │ 11     │ 0%   │ 买/卖  ││
│  └───────┴────────┴──────┴────────┘│
├─────────────────────────────────────┤
│  📰 市场事件                        │
│  🔥 金蛋热潮进行中！                │
│     金蛋股票 +40%，剩余 12 小时     │
└─────────────────────────────────────┘
```

#### 2. 个股详情页
```
┌─────────────────────────────────────┐
│  🥚 黑蛋股票 (BLACK)                │
├─────────────────────────────────────┤
│  当前价格：25,600 金币              │
│  24h 涨跌：+2,048 (+8.69%) 🟢      │
├─────────────────────────────────────┤
│  📈 价格走势（1天）                 │
│  [K线图区域]                        │
│  ├─ 时间：1H / 4H / 1D / 1W        │
│  └─ MA7: 24,500  MA30: 23,000      │
├─────────────────────────────────────┤
│  📊 股票信息                        │
│  ├─ 市值：1,280,000 金币            │
│  ├─ 24h 成交量：50 股               │
│  ├─ 分红率：10% / 天                │
│  └─ 波动率：高                      │
├─────────────────────────────────────┤
│  💼 我的持仓                        │
│  ├─ 持有：5 股                      │
│  ├─ 成本：20,000 / 股               │
│  └─ 盈亏：+28,000 (+28%) 🟢        │
├─────────────────────────────────────┤
│  [买入] [卖出] [设置提醒]           │
└─────────────────────────────────────┘
```

---

## 🗄️ 数据库设计

### 新增表

#### 1. `stock_prices` - 股价历史
```sql
CREATE TABLE stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,           -- 股票代码
  price DECIMAL(10, 2) NOT NULL,  -- 价格
  open DECIMAL(10, 2),            -- 开盘价
  high DECIMAL(10, 2),            -- 最高价
  low DECIMAL(10, 2),             -- 最低价
  close DECIMAL(10, 2),           -- 收盘价
  volume INTEGER DEFAULT 0,        -- 成交量
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  INDEX idx_symbol_timestamp (symbol, timestamp)
);
```

#### 2. `stock_holdings` - 玩家持仓
```sql
CREATE TABLE stock_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  average_cost DECIMAL(10, 2) NOT NULL,  -- 平均成本
  total_investment DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_id, symbol),
  INDEX idx_user_holdings (user_id)
);
```

#### 3. `stock_transactions` - 交易记录
```sql
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,                    -- 'BUY' / 'SELL'
  quantity INTEGER NOT NULL,
  price_per_share DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  profit DECIMAL(10, 2),                 -- 仅卖出时有值
  profit_rate DECIMAL(5, 2),             -- 盈亏率（%）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_transactions (user_id, created_at DESC),
  INDEX idx_symbol_transactions (symbol, created_at DESC)
);
```

#### 4. `stock_dividends` - 分红记录
```sql
CREATE TABLE stock_dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  dividend_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  INDEX idx_user_dividends (user_id, dividend_date DESC)
);
```

#### 5. `market_events` - 市场事件
```sql
CREATE TABLE market_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  effect JSONB NOT NULL,              -- { "BLACK": 0.5, "PURPLE": 0.3 }
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  INDEX idx_active_events (is_active, start_time, end_time)
);
```

---

## 🔧 API 端点设计

### 股票市场路由 (`/api/stock`)

#### 1. 获取市场概况
```
GET /api/stock/market
Response: {
  success: true,
  data: {
    stocks: [...],
    activeEvents: [...],
    timestamp: 1234567890
  }
}
```

#### 2. 获取个股详情
```
GET /api/stock/:symbol
Response: {
  success: true,
  data: {
    stock: { symbol, currentPrice, change24h, ... },
    priceHistory: [...],  // K线数据
    userHolding: { quantity, averageCost, ... } | null
  }
}
```

#### 3. 买入股票
```
POST /api/stock/buy
Body: { symbol, quantity }
Response: {
  success: true,
  data: {
    transaction: { ... },
    portfolio: { ... }
  }
}
```

#### 4. 卖出股票
```
POST /api/stock/sell
Body: { symbol, quantity }
Response: { success: true, data: { ... } }
```

#### 5. 获取投资组合
```
GET /api/stock/portfolio
Response: {
  success: true,
  data: {
    totalInvestment: 10000,
    currentValue: 10500,
    totalProfit: 500,
    totalProfitRate: 5.0,
    holdings: [...],
    dividends: 120
  }
}
```

#### 6. 获取交易记录
```
GET /api/stock/transactions?limit=50&offset=0
Response: { success: true, data: { transactions: [...] } }
```

#### 7. 获取排行榜
```
GET /api/stock/leaderboard?period=daily
Response: { success: true, data: { leaderboard: [...] } }
```

---

## 🎯 游戏平衡性

### 收益预期
- **保守玩家**（持有白/棕蛋股票）：年化收益 5-10%
- **平衡玩家**（银/金蛋股票）：年化收益 15-30%
- **激进玩家**（紫/黑蛋股票）：年化收益 30-100%（高风险）

### 风险控制
- 单只股票最大持仓限制：总资产的 50%
- 交易手续费：1%（防止频繁交易）
- 熔断机制：单日涨跌幅超过 ±50% 时触发，暂停交易 1 小时

---

## 🚀 开发计划

### Phase 1: 基础架构（1周）
- [ ] 数据库表设计与迁移
- [ ] 股价生成与更新逻辑
- [ ] 基础 API 端点

### Phase 2: 交易功能（1周）
- [ ] 买入/卖出股票
- [ ] 投资组合管理
- [ ] 交易记录

### Phase 3: UI 实现（1-2周）
- [ ] 市场概况页
- [ ] 个股详情页（含 K 线图）
- [ ] 投资组合页
- [ ] 交易记录页

### Phase 4: 高级功能（1周）
- [ ] 市场事件系统
- [ ] 分红系统
- [ ] 排行榜
- [ ] 价格提醒

### Phase 5: 测试与优化（1周）
- [ ] 平衡性测试
- [ ] 性能优化
- [ ] Bug 修复

---

## 📚 技术栈

### 前端
- **图表库**：Lightweight Charts (TradingView) 或 Chart.js
- **实时更新**：WebSocket / Server-Sent Events
- **状态管理**：扩展现有的 `state` 对象

### 后端
- **定时任务**：Cloudflare Workers Cron Triggers（更新股价、发放分红）
- **数据存储**：Supabase PostgreSQL
- **缓存**：Cloudflare KV（缓存最新股价）

---

## 💡 创新点

1. **蛋类股票概念**：独特的游戏主题结合
2. **供需影响股价**：玩家在交易市场的行为影响股市
3. **市场事件**：随机事件增加趣味性和不确定性
4. **分红系统**：鼓励长期持有，降低投机
5. **教育性**：让玩家通过游戏学习基础投资概念

---

## 🎮 与现有功能的整合

### 1. 与交易市场的联动
- 玩家在交易市场出售大量紫/黑蛋 → 对应股票下跌
- 股市中紫/黑蛋股票上涨 → 交易市场价格上涨

### 2. 与升级系统的联动
- 新增升级项：**股市分析师**
  - 效果：降低交易手续费、增加分红率

### 3. 与任务系统的联动
- 新增任务：
  - 首次购买股票
  - 持有股票获得分红
  - 股票盈利达到 10%

---

## ⚠️ 注意事项

1. **避免真实货币交易**：纯游戏内金币，不涉及真实货币
2. **价格波动合理性**：避免过于剧烈的波动导致玩家流失
3. **防止外挂**：交易记录审计，异常交易检测
4. **服务器负载**：股价更新频率需要平衡实时性与性能

---

## 📊 成功指标（KPI）

- **参与率**：20% 以上玩家使用股票功能
- **留存率**：股票玩家 7 日留存率 > 普通玩家 10%
- **交易频次**：平均每玩家每天 2-3 次交易
- **市场活跃度**：每日总成交量 > 1000 股

---

**文档版本**：v1.0  
**创建日期**：2025-11-17  
**下次更新**：待原型测试后
