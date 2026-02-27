# 市场交易功能快速部署指南

## 🚀 快速开始

### 第一步：部署数据库函数

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制并执行 `api/migrations/0003_market_functions.sql` 文件内容

或者使用命令行：

```bash
psql -U your_user -d your_database -f api/migrations/0003_market_functions.sql
```

### 第二步：验证函数创建成功

在 SQL Editor 中执行：

```sql
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%market%';
```

应该看到以下4个函数：
- ✅ `create_market_order`
- ✅ `buy_market_order`
- ✅ `cancel_market_order`
- ✅ `get_market_stats`

### 第三步：部署应用代码

```bash
# 进入 API 目录
cd api

# 构建（可选，如果使用 TypeScript）
npm run build

# 部署到 Cloudflare Workers
npm run deploy
```

### 第四步：测试 API

```bash
# 获取市场统计
curl -X GET "https://your-api.workers.dev/api/market/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取订单列表
curl -X GET "https://your-api.workers.dev/api/market/orders" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ 功能清单

部署完成后，您将拥有以下功能：

- ✅ **7 个 API 端点**
  - GET `/api/market/orders` - 查看市场订单
  - POST `/api/market/create-order` - 创建卖单
  - POST `/api/market/buy-order` - 购买订单
  - POST `/api/market/cancel-order` - 取消订单
  - GET `/api/market/my-orders` - 我的订单
  - GET `/api/market/transactions` - 交易记录
  - GET `/api/market/stats` - 市场统计

- ✅ **4 个数据库 RPC 函数**
  - 原子性创建订单
  - 原子性购买订单
  - 原子性取消订单
  - 获取市场统计

- ✅ **完整的市场配置**
  - 5% 交易手续费
  - 价格范围：1 - 1,000,000 金币
  - 数量范围：1 - 999,999
  - 每用户最多 10 个挂单

## 📊 配置说明

### 修改手续费率

编辑 `api/src/utils/gameLogic.ts`:

```typescript
MARKET: {
  FEE_RATE: 0.05,  // 修改这里，例如改为 0.03 (3%)
  // ... 其他配置
}
```

### 修改限制

同样在 `gameLogic.ts` 中：

```typescript
MARKET: {
  MIN_PRICE: 1,          // 最低价格
  MAX_PRICE: 1000000,    // 最高价格
  MIN_QUANTITY: 1,       // 最小数量
  MAX_QUANTITY: 999999,  // 最大数量
  MAX_ORDERS_PER_USER: 10  // 每用户最多挂单数
}
```

## 🔍 故障排查

### 问题 1: RPC 函数未找到

**症状**: API 返回错误 "function does not exist"

**解决方案**:
1. 确认已执行迁移脚本
2. 检查函数名是否正确
3. 验证数据库连接

### 问题 2: 交易失败

**症状**: 购买订单时返回错误

**可能原因**:
- 金币不足
- 订单已被购买
- 尝试购买自己的订单

**解决方案**: 检查错误消息中的 `error` 字段

### 问题 3: 库存未扣除

**症状**: 创建订单后库存未减少

**解决方案**:
1. 检查 RPC 函数是否正确执行
2. 查看数据库日志
3. 验证事务是否回滚

## 📚 更多信息

完整文档请参阅：
- [市场交易功能文档](./MARKET_TRADING_DOCUMENTATION.md)
- [API 测试套件](./api/src/utils/market.test.ts)

## ⚠️ 注意事项

1. **数据库迁移**: 必须先执行迁移脚本再部署代码
2. **环境变量**: 确保配置了正确的 Supabase 连接信息
3. **测试**: 在生产环境部署前，建议在测试环境充分测试
4. **备份**: 部署前备份数据库

## 🎉 部署完成！

如果所有测试都通过，恭喜您成功部署了市场交易功能！

玩家现在可以：
- 在市场上出售自己的蛋
- 购买其他玩家的蛋
- 管理自己的订单
- 查看交易历史

---

**部署日期**: 2025-10-10  
**版本**: 1.0.0
