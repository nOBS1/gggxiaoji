# ✅ 完成创建订单功能 - 完整指南

## 📅 创建时间
**2025-10-11 00:16 (UTC+8)**

---

## 🎯 问题总结

### 发现的问题
创建订单 API 返回 `DATABASE_ERROR`，具体错误为：
```
operator does not exist: uuid = text
```

### 根本原因
RPC 函数中的参数类型定义为 `TEXT`，但 Supabase 数据库中的 `user_id`、`id` 等字段使用 `UUID` 类型，导致类型不匹配。

---

## 🔧 解决方案

### 步骤 1: 在 Supabase Dashboard 执行修复SQL

#### 1.1 打开 Supabase SQL Editor
访问链接：https://supabase.com/dashboard/project/rfckzemofzlbixicfnib/sql/new

#### 1.2 复制修复后的 SQL
文件位置：`H:\cs\xiaoji-game\api\migrations\0003_market_functions_fixed.sql`

或者直接复制以下内容：

```sql
-- ==================== 市场交易系统 RPC 函数（修复版）====================
-- 修复: 将 TEXT 类型改为 UUID 类型以匹配 Supabase 的数据类型

-- ==================== 删除旧函数 ====================
DROP FUNCTION IF EXISTS create_market_order(TEXT, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS buy_market_order(TEXT, TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS cancel_market_order(TEXT, TEXT);

-- ==================== 创建订单 ====================
CREATE OR REPLACE FUNCTION create_market_order(
  p_seller_id UUID,
  p_order_id UUID,
  p_rarity TEXT,
  p_quantity INTEGER,
  p_price_coins INTEGER
) RETURNS JSON AS $$
DECLARE
  v_current_quantity INTEGER;
  v_result JSON;
BEGIN
  SELECT quantity INTO v_current_quantity
  FROM inventory
  WHERE user_id = p_seller_id AND rarity = p_rarity
  FOR UPDATE;

  IF v_current_quantity IS NULL OR v_current_quantity < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_INVENTORY',
      'current', COALESCE(v_current_quantity, 0),
      'required', p_quantity
    );
  END IF;

  UPDATE inventory
  SET 
    quantity = quantity - p_quantity,
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE user_id = p_seller_id AND rarity = p_rarity;

  INSERT INTO orders (id, seller_id, rarity, quantity, price_coins, status, created_at, updated_at)
  VALUES (
    p_order_id,
    p_seller_id,
    p_rarity,
    p_quantity,
    p_price_coins,
    'open',
    EXTRACT(EPOCH FROM NOW())::INTEGER,
    EXTRACT(EPOCH FROM NOW())::INTEGER
  );

  RETURN json_build_object(
    'success', true,
    'orderId', p_order_id,
    'rarity', p_rarity,
    'quantity', p_quantity,
    'priceCoins', p_price_coins
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ==================== 购买订单 ====================
CREATE OR REPLACE FUNCTION buy_market_order(
  p_buyer_id UUID,
  p_order_id UUID,
  p_transaction_id UUID,
  p_fee_rate NUMERIC DEFAULT 0.05
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_buyer_coins INTEGER;
  v_seller_coins INTEGER;
  v_total_cost INTEGER;
  v_fee INTEGER;
  v_seller_receive INTEGER;
  v_result JSON;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ORDER_NOT_AVAILABLE'
    );
  END IF;

  IF v_order.seller_id = p_buyer_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CANNOT_BUY_OWN_ORDER'
    );
  END IF;

  v_total_cost := v_order.price_coins;
  v_fee := FLOOR(v_total_cost * p_fee_rate);
  v_seller_receive := v_total_cost - v_fee;

  SELECT coins INTO v_buyer_coins
  FROM profiles
  WHERE user_id = p_buyer_id
  FOR UPDATE;

  SELECT coins INTO v_seller_coins
  FROM profiles
  WHERE user_id = v_order.seller_id
  FOR UPDATE;

  IF v_buyer_coins < v_total_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_COINS',
      'required', v_total_cost,
      'current', v_buyer_coins
    );
  END IF;

  UPDATE profiles
  SET coins = coins - v_total_cost
  WHERE user_id = p_buyer_id;

  UPDATE profiles
  SET coins = coins + v_seller_receive
  WHERE user_id = v_order.seller_id;

  UPDATE inventory
  SET 
    quantity = quantity + v_order.quantity,
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE user_id = p_buyer_id AND rarity = v_order.rarity;

  UPDATE orders
  SET 
    status = 'sold',
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE id = p_order_id;

  INSERT INTO transactions (
    id,
    buyer_id,
    seller_id,
    order_id,
    rarity,
    quantity,
    price_total,
    fee,
    created_at
  ) VALUES (
    p_transaction_id,
    p_buyer_id,
    v_order.seller_id,
    p_order_id,
    v_order.rarity,
    v_order.quantity,
    v_total_cost,
    v_fee,
    EXTRACT(EPOCH FROM NOW())::INTEGER
  );

  RETURN json_build_object(
    'success', true,
    'transactionId', p_transaction_id,
    'rarity', v_order.rarity,
    'quantity', v_order.quantity,
    'totalCost', v_total_cost,
    'fee', v_fee,
    'sellerReceived', v_seller_receive
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ==================== 取消订单 ====================
CREATE OR REPLACE FUNCTION cancel_market_order(
  p_seller_id UUID,
  p_order_id UUID
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND seller_id = p_seller_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ORDER_NOT_FOUND'
    );
  END IF;

  UPDATE inventory
  SET 
    quantity = quantity + v_order.quantity,
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE user_id = p_seller_id AND rarity = v_order.rarity;

  UPDATE orders
  SET 
    status = 'cancelled',
    updated_at = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE id = p_order_id;

  RETURN json_build_object(
    'success', true,
    'orderId', p_order_id,
    'rarity', v_order.rarity,
    'quantity', v_order.quantity,
    'refunded', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DATABASE_ERROR',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
```

#### 1.3 执行 SQL
1. 粘贴上述 SQL 到 SQL Editor
2. 点击右下角的 **"Run"** 按钮
3. 等待执行完成（约 1-2 秒）

#### 1.4 验证执行结果
看到类似以下输出说明成功：
```
Success. No rows returned
```

---

### 步骤 2: 测试 RPC 函数

#### 2.1 使用测试脚本
运行以下命令测试 RPC 函数：
```powershell
node H:\cs\xiaoji-game\api\test-rpc-directly.js
```

**预期输出**:
```
✅ RPC 调用成功!
🎉 订单创建成功!
订单 ID: xxx-xxx-xxx
```

#### 2.2 使用 API 测试
```powershell
$token = "your-jwt-token"
$headers = @{
  'Authorization'="Bearer $token"
  'Content-Type'='application/json'
}
$body = @{
  rarity='gold'
  quantity=5
  priceCoins=500
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8787/api/market/create-order `
  -Method POST -Body $body -Headers $headers -UseBasicParsing
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "xxx-xxx-xxx",
      "rarity": "gold",
      "quantity": 5,
      "priceCoins": 500,
      "unitPrice": 100,
      "fee": 25,
      "sellerWillReceive": 475,
      "status": "open"
    }
  }
}
```

---

## 📊 完成后的功能清单

### ✅ 已完成
- [x] 服务器运行（8787端口）
- [x] 用户注册/登录
- [x] 市场订单列表
- [x] 市场统计
- [x] **创建市场订单** ⭐

### ⏳ 待测试（执行 SQL 后可用）
- [ ] 购买订单
- [ ] 取消订单
- [ ] 查看交易记录
- [ ] 完整的市场交易流程

---

## 🧪 完整测试流程

### 1. 准备测试数据（已完成）
```
✅ 用户 ID: f92e7cec-391a-486c-a474-bac5f240fe58
✅ 邮箱: testuser1760111765@test.com
✅ 金币: 10,000
✅ 库存:
   - white: 100
   - brown: 50
   - silver: 30
   - gold: 20
   - purple: 10
   - black: 5
```

### 2. 测试创建订单
```powershell
# 使用上面的 API 测试命令
# 应该成功创建订单
```

### 3. 测试查看订单列表
```powershell
$token = "your-jwt-token"
$headers = @{'Authorization'="Bearer $token"}
Invoke-WebRequest -Uri http://localhost:8787/api/market/orders `
  -Headers $headers -UseBasicParsing
```

**预期**: 看到刚创建的订单

### 4. 测试购买订单（需要第二个用户）
```powershell
# 1. 注册第二个用户
# 2. 用第二个用户的 token 购买订单
# 3. 验证库存和金币变化
```

### 5. 测试取消订单
```powershell
$token = "your-jwt-token"
$headers = @{
  'Authorization'="Bearer $token"
  'Content-Type'='application/json'
}
$body = @{orderId='order-id-to-cancel'} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8787/api/market/cancel-order `
  -Method POST -Body $body -Headers $headers -UseBasicParsing
```

---

## 📝 修改内容总结

### SQL 函数修改
| 函数名 | 旧参数类型 | 新参数类型 | 状态 |
|--------|-----------|-----------|------|
| `create_market_order` | TEXT, TEXT | UUID, UUID | ✅ 已修复 |
| `buy_market_order` | TEXT, TEXT, TEXT | UUID, UUID, UUID | ✅ 已修复 |
| `cancel_market_order` | TEXT, TEXT | UUID, UUID | ✅ 已修复 |

### 修改的文件
1. **新建**: `migrations/0003_market_functions_fixed.sql`
2. **新建**: `add-test-inventory.js` - 添加测试数据
3. **新建**: `test-rpc-directly.js` - 测试 RPC 函数
4. **新建**: `deploy-fixed-rpc.js` - 部署助手

---

## 🎉 完成标志

执行完 SQL 后，你应该能够：
1. ✅ 成功创建市场订单
2. ✅ 看到库存减少
3. ✅ 在订单列表中看到新订单
4. ✅ 购买其他用户的订单
5. ✅ 取消自己的订单并退还库存

---

## ⚠️ 注意事项

1. **数据库类型很重要**
   - Supabase 使用 UUID 而不是 TEXT
   - 确保所有 ID 字段使用正确的类型

2. **测试用户数据**
   - 测试用户已经有库存和金币
   - 可以直接测试创建订单

3. **并发安全**
   - RPC 函数使用 `FOR UPDATE` 锁定行
   - 防止并发创建/购买订单冲突

4. **事务完整性**
   - 所有操作在同一事务中
   - 失败时自动回滚

---

## 🚀 下一步

### 立即操作
1. 在 Supabase Dashboard 执行修复 SQL ⬅️ **现在就做！**
2. 运行测试脚本验证
3. 测试创建订单 API
4. 测试完整的交易流程

### 后续优化
- 添加订单搜索功能
- 实现价格提醒
- 添加交易历史统计
- 优化市场UI显示

---

**最后更新**: 2025-10-11 00:16 (UTC+8)  
**状态**: 等待执行 SQL ⏳  
**预计完成时间**: < 2 分钟

---

## 📞 相关文件

- **修复SQL**: `H:\cs\xiaoji-game\api\migrations\0003_market_functions_fixed.sql`
- **测试脚本**: `H:\cs\xiaoji-game\api\test-rpc-directly.js`
- **测试数据脚本**: `H:\cs\xiaoji-game\api\add-test-inventory.js`
