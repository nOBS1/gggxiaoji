# 交易记录查询修复说明

**修复日期**: 2025-10-11  
**问题**: 点击"交易记录"标签时返回 500 错误

---

## 🐛 问题描述

### 症状
用户登录后点击"交易记录"标签时：

**后端错误**:
```
[Error] AppError: Database error
```

**前端错误**:
```
GET http://localhost:8787/api/market/transactions 500 (Internal Server Error)
ReferenceError: fetchMarketStats is not defined
```

---

## 🔍 问题原因

### 问题 1: 数据库查询关联错误

**原始代码** (`api/src/routes/market.ts`):
```typescript
const { data: transactions, error } = await supabase
  .from('transactions')
  .select(`
    *,
    buyer:profiles!buyer_id(nickname),
    seller:profiles!seller_id(nickname)
  `)
  .or(`buyer_id.eq.${user.userId},seller_id.eq.${user.userId}`)
  .order('created_at', { ascending: false })
  .limit(50);
```

**问题**:
- Supabase 的 `!` 语法用于指定外键关联
- `transactions` 表的外键引用的是 `users` 表，不是 `profiles` 表
- `profiles!buyer_id` 尝试通过 `buyer_id` 外键关联 `profiles`，但实际外键是 `REFERENCES users(id)`
- 导致关联查询失败，返回 500 错误

**数据库结构**:
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES users(id),    -- 引用 users 表
  seller_id UUID NOT NULL REFERENCES users(id),   -- 引用 users 表
  ...
);
```

### 问题 2: 前端导入缺失

**原始代码** (`src/js/main.js`):
```javascript
import {
  initMarketUI,
  renderMarketOrders,
  // ... 其他函数
  fetchTransactions,
  // ❌ 缺少 fetchMarketStats
  createOrder,
  // ...
} from './market.js';
```

**问题**:
- `main.js` 第 307 行调用了 `fetchMarketStats()`
- 但该函数没有在导入列表中
- 导致 `ReferenceError: fetchMarketStats is not defined`

---

## ✅ 解决方案

### 修复 1: 简化交易记录查询

改用**分步查询**替代关联查询：

1. 先查询交易记录
2. 提取所有涉及的用户 ID
3. 批量查询用户信息
4. 手动合并数据

**修复后的代码**:
```typescript
market.get('/transactions', async (c) => {
  const user = c.get('user');

  try {
    const supabase = getSupabase(c.env);
    
    // 1. 先获取交易记录
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`buyer_id.eq.${user.userId},seller_id.eq.${user.userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Market Transactions Error]', error);
      throw Errors.DATABASE_ERROR;
    }

    // 如果没有交易记录，直接返回
    if (!transactions || transactions.length === 0) {
      return c.json({
        success: true,
        data: { transactions: [] },
      });
    }

    // 2. 获取所有涉及的用户 ID
    const userIds = [...new Set([
      ...transactions.map(tx => tx.buyer_id),
      ...transactions.map(tx => tx.seller_id)
    ])];

    // 3. 批量查询用户信息
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, nickname')
      .in('user_id', userIds);

    if (profileError) {
      console.error('[Market Transactions Profile Error]', profileError);
      // 即使获取用户信息失败，也返回交易记录
      return c.json({
        success: true,
        data: {
          transactions: transactions.map(tx => ({
            ...tx,
            buyer: { nickname: 'Unknown' },
            seller: { nickname: 'Unknown' }
          })),
        },
      });
    }

    // 4. 创建用户信息映射
    const profileMap = (profiles || []).reduce((acc, profile) => {
      acc[profile.user_id] = { nickname: profile.nickname };
      return acc;
    }, {} as Record<string, { nickname: string }>);

    // 5. 给每个交易添加用户信息
    const enrichedTransactions = transactions.map(tx => ({
      ...tx,
      buyer: profileMap[tx.buyer_id] || { nickname: 'Unknown' },
      seller: profileMap[tx.seller_id] || { nickname: 'Unknown' }
    }));

    return c.json({
      success: true,
      data: { transactions: enrichedTransactions },
    });
  } catch (error) {
    console.error('[Market Transactions Error]', error);
    throw Errors.DATABASE_ERROR;
  }
});
```

**优点**:
- ✅ 避免了复杂的外键关联语法
- ✅ 更容易理解和维护
- ✅ 即使用户信息查询失败，也能返回交易记录
- ✅ 性能良好（批量查询，避免 N+1 问题）

### 修复 2: 添加缺失的导入

**修复后的代码** (`src/js/main.js`):
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
  fetchMarketStats,      // ✅ 添加此行
  createOrder,
  buyOrder,
  cancelOrder,
  handleFilterChange,
  handleSortChange
} from './market.js';
```

---

## 🧪 测试验证

### 测试步骤

1. **启动后端服务器**
   ```bash
   cd H:\cs\xiaoji-game\api
   npm run dev
   ```

2. **重新构建前端**
   ```bash
   cd H:\cs\xiaoji-game
   npm run build
   ```

3. **登录并测试**
   - 打开浏览器: `http://localhost:3000`
   - 登录账号
   - 点击"市场"标签
   - 点击"交易记录"子标签

### 预期结果

**如果有交易记录**:
```
✅ 显示交易列表
✅ 每条记录显示买家/卖家昵称
✅ 显示交易详情（稀有度、数量、价格）
✅ 显示买入/卖出标识
```

**如果没有交易记录**:
```
✅ 显示空状态提示
✅ 不会报错
```

**控制台日志**:
```
[Market] Fetched orders: X Filter: null
✅ 没有 500 错误
✅ 没有 "fetchMarketStats is not defined" 错误
```

---

## 📊 修复影响范围

### 修改的文件

1. **后端**: `api/src/routes/market.ts`
   - 修改 `GET /api/market/transactions` 端点
   - 从关联查询改为分步查询

2. **前端**: `src/js/main.js`
   - 添加 `fetchMarketStats` 导入

### 重新构建

- ✅ 前端已重新构建（`npm run build`）
- ✅ 后端自动热重载（TypeScript）

---

## 🔧 技术细节

### Supabase 外键关联语法

Supabase 的 `!` 语法格式：
```typescript
// 正确示例
select(`
  *,
  user:users!user_id(id, name)
`)

// 说明:
// - users: 要关联的表名
// - user_id: 当前表的外键字段
// - 外键必须正确定义: REFERENCES users(id)
```

### 为什么选择分步查询？

**优点**:
1. **更清晰**: 每一步都很明确
2. **更健壮**: 即使某一步失败，也能返回部分数据
3. **更灵活**: 容易添加更多关联或过滤条件
4. **性能良好**: 批量查询，避免 N+1 问题

**缺点**:
1. 代码稍长（但更易维护）
2. 需要手动合并数据

### 性能对比

| 方法 | SQL查询数 | 性能 | 可维护性 |
|------|----------|------|----------|
| 关联查询 | 1次 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 分步查询 | 2次 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

对于用户量不大的应用，分步查询的性能完全足够。

---

## 🎯 相关端点对比

### `/api/market/orders` - 正常工作

```typescript
// 使用了相同的分步查询方式
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'open');

// 然后批量查询卖家信息
const { data: sellers } = await supabase
  .from('profiles')
  .select('user_id, nickname, avatar')
  .in('user_id', sellerIds);
```

### `/api/market/transactions` - 现已修复

采用了相同的模式，确保一致性。

---

## 📝 后续建议

### 短期优化
1. ✅ 已修复：交易记录查询
2. ✅ 已修复：前端导入缺失

### 中期优化（可选）
1. 考虑添加交易记录缓存（Redis）
2. 添加分页支持（当前限制50条）
3. 添加按时间范围筛选

### 长期优化（可选）
1. 考虑使用 PostgreSQL 视图简化查询
2. 添加交易统计（每日/每周交易量）

---

## 🔗 相关文档

- [Supabase 关联查询文档](https://supabase.com/docs/guides/database/joins-and-nested-tables)
- [市场交易系统完整文档](./MARKET_IMPLEMENTATION_SUMMARY.md)
- [第三期工程进度报告](./PHASE3_PROGRESS_REPORT.md)

---

**修复状态**: ✅ 完成  
**测试状态**: ✅ 已验证  
**上线状态**: ✅ 可立即上线
