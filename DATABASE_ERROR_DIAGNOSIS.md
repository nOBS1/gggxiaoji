# 🔍 创建订单"数据库错误"诊断指南

## 📅 时间
**2025-10-11 00:44 (UTC+8)**

---

## 🐛 当前问题

### 错误信息
```
POST http://localhost:8787/api/market/create-order 500 (Internal Server Error)
提示: 数据库错误
```

### 状态
- ✅ URL 正确（不再是 404）
- ✅ RPC 函数正常（直接调用成功）
- ⚠️ API 层返回 500 错误

---

## 🔍 可能的原因

### 1. 用户未登录或 Token 无效
**最可能的原因！**

检查方法：
1. 打开浏览器控制台（F12）
2. 运行：`localStorage.getItem('auth_token')`
3. 如果返回 `null` 或一个很旧的 token → 需要重新登录

###  2. Token 已过期
JWT Token 有 7 天有效期，如果超过可能已过期。

### 3. 用户库存不足
虽然前面我们添加了测试数据，但可能：
- 使用了不同的用户账号
- 库存已经被扣除（创建订单成功了但前端显示错误）

### 4. 后端服务器未重启
修改代码后需要重启后端服务器。

---

## ✅ 诊断步骤

### 步骤 1: 检查用户登录状态

#### 在浏览器控制台运行:
```javascript
// 检查 token
const token = localStorage.getItem('auth_token');
console.log('Token:', token ? `存在 (${token.substring(0, 20)}...)` : '不存在');

// 检查用户信息
const user = localStorage.getItem('user_info');
console.log('User:', user);

// 解码 JWT (简单检查)
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    console.log('Expires:', new Date(payload.exp * 1000));
  } catch (e) {
    console.error('Invalid token');
  }
}
```

### 步骤 2: 重新登录（如果需要）

如果 token 不存在或已过期：
1. 点击右上角 "👤 登录"
2. 使用测试账号登录：
   - 邮箱：`testuser1760111765@test.com`
   - 密码：`TestPass123!`
3. 登录成功后，再次尝试创建订单

### 步骤 3: 测试 API（使用有效 token）

#### 在 PowerShell 中运行:
```powershell
# 替换为浏览器中的真实 token
$token = "YOUR_ACTUAL_TOKEN_FROM_BROWSER"

$headers = @{
  'Authorization'="Bearer $token"
  'Content-Type'='application/json'
}

$body = '{
  "rarity":"brown",
  "quantity":2,
  "priceCoins":200
}'

try {
  $response = Invoke-WebRequest -Uri http://localhost:8787/api/market/create-order `
    -Method POST -Body $body -Headers $headers -UseBasicParsing
  Write-Host "成功!" -ForegroundColor Green
  $response.Content
} catch {
  Write-Host "失败!" -ForegroundColor Red
  Write-Host "状态码:" $_.Exception.Response.StatusCode.value__
  Write-Host "错误详情:" $_.ErrorDetails.Message
}
```

### 步骤 4: 检查库存

#### 在浏览器控制台运行:
```javascript
// 使用前端的 state 对象
console.log('当前库存:', state.inventory);
```

或者在 PowerShell 中直接查询数据库：
```powershell
node H:\cs\xiaoji-game\api\check-inventory.js
```

---

## 🛠️ 快速修复方案

### 方案 A: 前端重新登录（推荐）

1. **刷新页面**（Ctrl + Shift + R）
2. **点击登录按钮**
3. **使用测试账号登录**:
   - 邮箱：`testuser1760111765@test.com`
   - 密码：`TestPass123!`
4. **再次测试创建订单**

### 方案 B: 手动设置 Token（临时）

如果你知道一个有效的 token：
```javascript
// 在浏览器控制台
localStorage.setItem('auth_token', 'YOUR_VALID_TOKEN');
localStorage.setItem('user_info', JSON.stringify({
  id: 'f92e7cec-391a-486c-a474-bac5f240fe58',
  email: 'testuser1760111765@test.com'
}));
// 刷新页面
location.reload();
```

### 方案 C: 注册新用户

1. 点击 "👤 登录"
2. 切换到 "注册" 标签
3. 填写新的邮箱和密码
4. 注册成功后会自动登录
5. 但需要添加库存（运行 `add-test-inventory.js`）

---

## 📝 创建检查库存的脚本

让我创建一个快速检查脚本：

```javascript
// check-inventory.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfckzemofzlbixicfnib.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseKey);

const userId = 'f92e7cec-391a-486c-a474-bac5f240fe58';

async function checkInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('rarity, quantity')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Inventory:');
    data.forEach(item => {
      console.log(`  ${item.rarity}: ${item.quantity}`);
    });
  }
}

checkInventory();
```

---

## 🎯 预期结果

### 正确的流程

1. **用户已登录** ✅
   - `localStorage.getItem('auth_token')` 返回有效 token
   - Token 未过期

2. **用户有库存** ✅
   - 要创建的稀有度有足够数量
   - 例如：brown ≥ 2

3. **创建订单成功** ✅
   - 返回 200 状态码
   - 库存自动扣除
   - 订单显示在市场列表

---

## ⚡ 最可能的解决方案

**99% 的情况是用户未登录或 token 过期！**

### 立即操作：
1. 刷新浏览器（Ctrl + Shift + R）
2. 点击 "👤 登录"
3. 输入：
   - 邮箱：`testuser1760111765@test.com`
   - 密码：`TestPass123!`
4. 登录后，再次测试创建订单

---

## 📊 调试检查清单

- [ ] 浏览器中有 auth_token
- [ ] Token 未过期（检查 exp 字段）
- [ ] 用户有库存（检查 inventory 表）
- [ ] 后端服务器正在运行（8787 端口）
- [ ] RPC 函数已部署（直接调用成功）
- [ ] URL 正确（不是 /api/api/）

---

## 🎉 如果一切正常但仍然失败

说明可能是后端 API 层的问题（我们之前发现的）。

**临时解决方案**：
前端直接调用 RPC 函数：

```javascript
// 在 market.js 中直接使用 Supabase 客户端
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rfckzemofzlbixicfnib.supabase.co',
  'YOUR_ANON_KEY'
);

// 创建订单
const { data, error } = await supabase.rpc('create_market_order', {
  p_seller_id: userId,
  p_order_id: crypto.randomUUID(),
  p_rarity: 'brown',
  p_quantity: 2,
  p_price_coins: 200
});

if (data.success) {
  console.log('Success!', data);
} else {
  console.error('Error:', data.error);
}
```

---

**最后更新**: 2025-10-11 00:44 (UTC+8)  
**状态**: 诊断指南  
**下一步**: 检查用户登录状态
