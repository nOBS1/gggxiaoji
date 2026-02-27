# 市场可交易蛋类型限制更新

## 📋 更新概述

市场交易系统现在**只允许交易紫蛋、金蛋和黑蛋**，不再支持白蛋、棕蛋和银蛋的交易。

## 🔧 修改内容

### 1. 前端修改

#### `index.html`
- ✅ 创建订单下拉框：移除白蛋、棕蛋、银蛋选项，只保留紫蛋、金蛋、黑蛋
- ✅ 筛选按钮：移除白蛋、棕蛋、银蛋按钮，只保留"全部"、紫蛋、金蛋、黑蛋

#### `src/js/market.js`
- ✅ 添加 `TRADABLE_RARITIES` 常量：`['purple', 'gold', 'black']`
- ✅ 在 `createOrder()` 函数中添加前端验证，拦截不可交易的蛋类型
- ✅ 添加错误消息映射 `NOT_TRADABLE`

#### `src/js/i18n.js`
- ✅ 中文翻译：`notTradable: '该类型的蛋不可交易，只能交易紫蛋、金蛋和黑蛋'`
- ✅ 英文翻译：`notTradable: 'This egg type cannot be traded. Only purple, gold, and black eggs are tradable.'`

### 2. 后端修改

#### `api/src/utils/gameLogic.ts`
- ✅ 在 `GAME_CONFIG.MARKET` 中添加：`TRADABLE_RARITIES: ['purple', 'gold', 'black']`
- ✅ 在 `validateMarketOrder()` 函数中添加验证逻辑，检查蛋类型是否可交易
- ✅ 返回 `NOT_TRADABLE` 错误代码

#### `api/src/middleware/errorHandler.ts`
- ✅ 添加新错误定义：
  ```typescript
  NOT_TRADABLE: new AppError(
    'NOT_TRADABLE',
    '该类型的蛋不可交易，只能交易紫蛋、金蛋和黑蛋',
    'This egg type cannot be traded. Only purple, gold, and black eggs are tradable.',
    400
  )
  ```

#### `api/src/routes/market.ts`
- ✅ 在创建订单时，如果验证失败且错误代码为 `NOT_TRADABLE`，抛出对应的错误

## 🧪 测试要点

### 前端测试
1. **创建订单表单**
   - ✅ 确认下拉框只显示紫蛋、金蛋、黑蛋
   - ✅ 尝试选择任一可交易蛋类型，应该能正常创建订单

2. **筛选功能**
   - ✅ 确认只显示"全部"、"紫蛋"、"金蛋"、"黑蛋"四个按钮
   - ✅ 点击各个筛选按钮，应该正确显示对应稀有度的订单

3. **错误提示**
   - ✅ 如果后端返回 `NOT_TRADABLE` 错误，应该显示对应的中/英文错误消息

### 后端测试
使用以下命令测试后端验证：

```bash
# 测试尝试创建白蛋订单（应该失败）
curl -X POST http://localhost:8787/api/market/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rarity":"white","quantity":1,"priceCoins":100}'

# 预期响应：
{
  "success": false,
  "error": {
    "code": "NOT_TRADABLE",
    "message": "该类型的蛋不可交易，只能交易紫蛋、金蛋和黑蛋"
  }
}

# 测试创建紫蛋订单（应该成功，前提是有足够库存）
curl -X POST http://localhost:8787/api/market/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rarity":"purple","quantity":1,"priceCoins":100}'
```

### 数据库测试
检查现有订单：
```sql
-- 查看当前所有开放订单的稀有度分布
SELECT rarity, COUNT(*) as count 
FROM orders 
WHERE status = 'open' 
GROUP BY rarity;

-- 如果存在白蛋、棕蛋或银蛋的订单，它们仍然可以被购买
-- 但新订单只能是紫蛋、金蛋或黑蛋
```

## 📝 注意事项

1. **现有订单**：已存在的白蛋、棕蛋、银蛋订单**不会被删除**，仍然可以被购买或取消
2. **新订单**：从现在开始，只能创建紫蛋、金蛋、黑蛋的新订单
3. **双重验证**：前端和后端都进行验证，确保数据安全性
4. **国际化**：错误消息支持中英文切换

## 🚀 部署状态

- ✅ 前端已重新构建（`npm run build`）
- ✅ 后端服务器运行中（TypeScript 自动热重载）
- ✅ 所有修改已完成并测试通过

## 🔗 相关文件

### 前端
- `index.html` - UI 结构
- `src/js/market.js` - 市场逻辑
- `src/js/i18n.js` - 国际化翻译

### 后端
- `api/src/utils/gameLogic.ts` - 游戏逻辑和验证
- `api/src/middleware/errorHandler.ts` - 错误处理
- `api/src/routes/market.ts` - 市场路由

---

**更新时间**: 2025-10-11  
**更新内容**: 限制市场交易为紫蛋、金蛋和黑蛋  
**影响范围**: 市场创建订单功能、筛选功能
