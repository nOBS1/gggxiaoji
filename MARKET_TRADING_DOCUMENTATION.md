# 市场交易功能文档 (Market Trading Documentation)

## 📋 目录 (Table of Contents)

1. [概述 (Overview)](#概述-overview)
2. [功能特性 (Features)](#功能特性-features)
3. [API 端点 (API Endpoints)](#api-端点-api-endpoints)
4. [交易机制 (Trading Mechanism)](#交易机制-trading-mechanism)
5. [使用示例 (Usage Examples)](#使用示例-usage-examples)
6. [部署指南 (Deployment Guide)](#部署指南-deployment-guide)
7. [测试 (Testing)](#测试-testing)
8. [常见问题 (FAQ)](#常见问题-faq)

---

## 概述 (Overview)

市场交易系统允许玩家之间买卖游戏内的蛋（eggs）。系统使用 PostgreSQL 的原子性 RPC 函数确保所有交易的数据一致性和安全性。

### 核心功能
- ✅ 创建卖单（挂单）
- ✅ 购买订单
- ✅ 取消订单
- ✅ 查看市场订单列表
- ✅ 查看个人订单历史
- ✅ 查看交易记录
- ✅ 市场统计信息

### 技术特点
- 🔒 **事务安全**：使用数据库 RPC 函数确保原子性操作
- 💰 **手续费机制**：5% 交易手续费，自动从交易金额中扣除
- 🚀 **高性能**：优化的数据库查询和索引
- 🌍 **国际化支持**：中英文双语错误消息
- 📊 **实时统计**：市场数据统计和分析

---

## 功能特性 (Features)

### 1. 订单管理

#### 创建订单 (Create Order)
- 玩家可以挂单出售自己的蛋
- 自动验证库存是否足够
- 原子性扣除库存并创建订单
- 每个玩家最多同时挂 10 个订单

#### 购买订单 (Buy Order)
- 玩家可以购买市场上的订单
- 自动验证金币是否足够
- 原子性完成以下操作：
  - 扣除买家金币
  - 增加卖家金币（扣除手续费后）
  - 增加买家库存
  - 更新订单状态
  - 创建交易记录

#### 取消订单 (Cancel Order)
- 玩家可以取消自己的未售出订单
- 自动退还库存
- 更新订单状态为已取消

### 2. 手续费机制

- **费率**：5% (可配置)
- **计算方式**：向下取整
- **示例**：
  - 100 金币交易 → 5 金币手续费
  - 99 金币交易 → 4 金币手续费
  - 19 金币交易 → 0 金币手续费（不到 1 金币）

### 3. 限制和验证

| 参数 | 最小值 | 最大值 |
|------|--------|--------|
| 价格 | 1 金币 | 1,000,000 金币 |
| 数量 | 1 | 999,999 |
| 每用户挂单数 | - | 10 |

---

## API 端点 (API Endpoints)

### 1. GET `/api/market/orders`
获取市场挂单列表

**查询参数**：
- `rarity` (可选): 稀有度筛选 (`white`, `brown`, `silver`, `gold`, `purple`, `black`)
- `sortBy` (可选): 排序字段 (`created_at`, `price_coins`, `quantity`)
- `sortOrder` (可选): 排序方向 (`asc`, `desc`)
- `limit` (可选): 每页数量 (默认: 20, 最大: 100)
- `offset` (可选): 偏移量 (默认: 0)

**响应示例**：
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "seller_id": "user_456",
        "seller": {
          "nickname": "玩家A",
          "avatar": "avatar_url"
        },
        "rarity": "gold",
        "quantity": 10,
        "price_coins": 1000,
        "unitPrice": 100,
        "fee": 50,
        "sellerWillReceive": 950,
        "status": "open",
        "created_at": 1704067200,
        "updated_at": 1704067200
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. POST `/api/market/create-order`
创建卖单

**请求体**：
```json
{
  "rarity": "gold",
  "quantity": 10,
  "priceCoins": 1000
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_789",
      "rarity": "gold",
      "quantity": 10,
      "priceCoins": 1000,
      "unitPrice": 100,
      "fee": 50,
      "sellerWillReceive": 950,
      "status": "open"
    }
  }
}
```

**错误响应**：
- `INSUFFICIENT_INVENTORY`: 库存不足
- `INVALID_INPUT`: 参数无效
- `TOO_MANY_ORDERS`: 挂单数量超过限制

---

### 3. POST `/api/market/buy-order`
购买订单

**请求体**：
```json
{
  "orderId": "order_123"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "trans_456",
      "rarity": "gold",
      "quantity": 10,
      "totalCost": 1000,
      "fee": 50
    },
    "message": "购买成功"
  }
}
```

**错误响应**：
- `ORDER_NOT_AVAILABLE`: 订单已失效或被购买
- `CANNOT_BUY_OWN_ORDER`: 不能购买自己的订单
- `INSUFFICIENT_COINS`: 金币不足

---

### 4. POST `/api/market/cancel-order`
取消订单

**请求体**：
```json
{
  "orderId": "order_123"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_123",
      "rarity": "gold",
      "quantity": 10,
      "refunded": true
    },
    "message": "订单已取消，库存已退还"
  }
}
```

---

### 5. GET `/api/market/my-orders`
获取我的订单列表

**响应示例**：
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "rarity": "gold",
        "quantity": 10,
        "price_coins": 1000,
        "status": "open",
        "created_at": 1704067200
      }
    ]
  }
}
```

---

### 6. GET `/api/market/transactions`
获取我的交易记录

**响应示例**：
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "trans_123",
        "buyer_id": "user_456",
        "seller_id": "user_789",
        "buyer": { "nickname": "买家" },
        "seller": { "nickname": "卖家" },
        "order_id": "order_123",
        "rarity": "gold",
        "quantity": 10,
        "price_total": 1000,
        "fee": 50,
        "created_at": 1704067200
      }
    ]
  }
}
```

---

### 7. GET `/api/market/stats`
获取市场统计信息

**响应示例**：
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalOrders": 150,
      "openOrders": 42,
      "soldOrders": 108,
      "totalVolume": 125000,
      "byRarity": {
        "white": { "count": 10, "avgPrice": 50, "minPrice": 10, "maxPrice": 100 },
        "gold": { "count": 5, "avgPrice": 1000, "minPrice": 500, "maxPrice": 2000 }
      }
    },
    "feeRate": 0.05,
    "config": {
      "minPrice": 1,
      "maxPrice": 1000000,
      "minQuantity": 1,
      "maxQuantity": 999999,
      "maxOrdersPerUser": 10
    }
  }
}
```

---

## 交易机制 (Trading Mechanism)

### 交易流程

#### 1. 创建订单流程
```
玩家发起创建订单
    ↓
验证参数（稀有度、数量、价格）
    ↓
检查用户挂单数量（<= 10）
    ↓
调用 create_market_order RPC 函数
    ↓
  [数据库原子操作]
  - 锁定用户库存
  - 检查库存是否足够
  - 扣除库存
  - 创建订单记录
    ↓
返回订单信息（包含手续费计算）
```

#### 2. 购买订单流程
```
玩家发起购买订单
    ↓
调用 buy_market_order RPC 函数
    ↓
  [数据库原子操作]
  - 锁定订单（防止重复购买）
  - 验证订单状态
  - 验证不是自己的订单
  - 锁定买卖双方金币
  - 检查买家金币是否足够
  - 扣除买家金币
  - 增加卖家金币（扣除手续费）
  - 增加买家库存
  - 更新订单状态为 sold
  - 创建交易记录
    ↓
返回交易信息
```

#### 3. 取消订单流程
```
玩家发起取消订单
    ↓
调用 cancel_market_order RPC 函数
    ↓
  [数据库原子操作]
  - 锁定订单
  - 验证订单所有权
  - 验证订单状态为 open
  - 退还库存
  - 更新订单状态为 cancelled
    ↓
返回取消结果
```

### 数据一致性保证

所有市场交易操作都使用 PostgreSQL 的事务和行级锁保证数据一致性：

1. **FOR UPDATE 锁**：防止并发修改
2. **原子性事务**：要么全部成功，要么全部回滚
3. **错误处理**：任何步骤失败都会回滚整个事务

---

## 使用示例 (Usage Examples)

### 示例 1：创建卖单

```javascript
// 出售 10 个金蛋，价格 1000 金币
const response = await fetch('/api/market/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    rarity: 'gold',
    quantity: 10,
    priceCoins: 1000
  })
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "data": {
//     "order": {
//       "id": "xyz123",
//       "unitPrice": 100,  // 每个 100 金币
//       "fee": 50,         // 手续费 50 金币
//       "sellerWillReceive": 950  // 卖家将收到 950 金币
//     }
//   }
// }
```

### 示例 2：购买订单

```javascript
// 购买订单
const response = await fetch('/api/market/buy-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    orderId: 'order_123'
  })
});

const data = await response.json();
console.log(data);
// {
//   "success": true,
//   "data": {
//     "transaction": {
//       "id": "trans_456",
//       "totalCost": 1000,  // 买家支付 1000 金币
//       "fee": 50           // 其中 50 金币是手续费
//     }
//   }
// }
```

### 示例 3：查询市场订单

```javascript
// 查询金蛋订单，按价格从低到高排序
const response = await fetch(
  '/api/market/orders?rarity=gold&sortBy=price_coins&sortOrder=asc&limit=20',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);

const data = await response.json();
console.log(data.data.orders);
```

---

## 部署指南 (Deployment Guide)

### 1. 数据库迁移

首先执行数据库迁移文件以创建 RPC 函数：

```bash
# 连接到 PostgreSQL 数据库
psql -U your_user -d your_database

# 执行迁移脚本
\i api/migrations/0003_market_functions.sql
```

或使用 Supabase Dashboard：
1. 进入 SQL Editor
2. 粘贴 `0003_market_functions.sql` 的内容
3. 点击 Run 执行

### 2. 验证 RPC 函数

```sql
-- 验证函数是否创建成功
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%market%';

-- 应该看到以下函数：
-- - create_market_order
-- - buy_market_order
-- - cancel_market_order
-- - get_market_stats
```

### 3. 配置环境变量

确保以下环境变量已配置：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
```

### 4. 部署代码

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Workers
npm run deploy
```

### 5. 验证部署

使用以下命令验证 API 是否正常工作：

```bash
# 获取市场统计
curl -X GET "https://your-api.workers.dev/api/market/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取订单列表
curl -X GET "https://your-api.workers.dev/api/market/orders?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 测试 (Testing)

### 单元测试

测试文件位于 `api/src/utils/market.test.ts`，包含以下测试套件：

- ✅ 市场配置测试
- ✅ 手续费计算测试
- ✅ 卖家收入计算测试
- ✅ 单价计算测试
- ✅ 价格验证测试
- ✅ 数量验证测试
- ✅ 订单参数验证测试
- ✅ 市场交易场景测试
- ✅ 边界条件测试
- ✅ 手续费公平性测试

### 手动测试步骤

1. **创建订单测试**
   ```bash
   curl -X POST "https://your-api/api/market/create-order" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"rarity":"white","quantity":10,"priceCoins":100}'
   ```

2. **购买订单测试**
   ```bash
   curl -X POST "https://your-api/api/market/buy-order" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"orderId":"ORDER_ID"}'
   ```

3. **取消订单测试**
   ```bash
   curl -X POST "https://your-api/api/market/cancel-order" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"orderId":"ORDER_ID"}'
   ```

---

## 常见问题 (FAQ)

### Q1: 为什么手续费有时会是 0？

**A**: 当交易金额很小时（例如 1-19 金币），5% 的手续费会向下取整为 0。这是为了让小额交易更友好。

### Q2: 能否修改手续费率？

**A**: 可以。在 `gameLogic.ts` 中修改 `GAME_CONFIG.MARKET.FEE_RATE` 的值即可。修改后需要重新部署。

### Q3: 订单被购买后能否取消？

**A**: 不能。只有状态为 `open` 的订单才能被取消。已售出 (`sold`) 或已取消 (`cancelled`) 的订单无法修改。

### Q4: 如何防止恶意刷单？

**A**: 系统已实现以下防护措施：
- 每个用户最多同时挂 10 个订单
- 价格和数量有严格的范围限制
- 不能购买自己的订单
- 所有操作都有原子性保证

### Q5: 交易失败后会回滚吗？

**A**: 是的。所有市场操作都使用数据库事务，任何步骤失败都会自动回滚，确保数据一致性。

### Q6: 如何查看市场交易数据？

**A**: 使用 `/api/market/stats` 端点可以获取市场统计数据，包括总订单数、总交易量、各稀有度的价格统计等。

### Q7: 能否设置订单过期时间？

**A**: 当前版本没有订单过期机制。可以通过定时任务清理长期未售出的订单来实现类似功能。

---

## 性能优化建议

1. **数据库索引**
   - 已为 `orders` 表创建了以下索引：
     - `idx_orders_seller`
     - `idx_orders_status`
     - `idx_orders_rarity`
     - `idx_orders_created_at`

2. **查询优化**
   - 使用分页限制返回数量
   - 使用 `count: 'exact'` 仅在需要时获取总数
   - 使用 JOIN 减少查询次数

3. **缓存策略**
   - 可以考虑缓存市场统计数据（5-10 分钟有效期）
   - 热门订单列表可以缓存

---

## 下一步计划

- [ ] 添加订单搜索功能
- [ ] 实现价格历史记录
- [ ] 添加交易通知系统
- [ ] 实现竞价系统
- [ ] 添加订单过期机制
- [ ] 实现批量购买功能

---

## 支持与反馈

如有问题或建议，请联系开发团队或提交 Issue。

**文档版本**: 1.0.0  
**最后更新**: 2025-10-10
