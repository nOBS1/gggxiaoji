# 本地数据同步功能说明

## 问题背景

用户在**未登录状态**下玩游戏时，游戏数据保存在浏览器的 `localStorage` 中。当用户**首次登录**时，这些本地数据需要同步到服务器账号，否则会导致：

- ❌ 用户辛苦积累的蛋、金币、升级等数据丢失
- ❌ 登录后库存为空，无法创建市场订单（提示"库存不足"错误）
- ❌ 用户体验差，可能导致用户流失

## 解决方案

实现了**自动同步本地游戏数据到服务器**的功能，在用户登录或注册时自动触发。

### 核心特性

1. **智能合并策略**
   - **库存和金币**：取本地和服务器的较大值
   - **统计数据**：累加（总点击次数、总卖出蛋数）
   - **升级等级**：取较大值
   - **黑色保底计数**：取较大值

2. **无缝体验**
   - 登录/注册时自动在后台同步
   - 同步失败不会阻塞登录流程
   - 显示友好的提示消息

3. **数据安全**
   - 使用白名单验证，只同步合法的数据字段
   - 服务器端进行数据校验和范围检查
   - 记录详细的同步日志，便于排查问题

## 技术实现

### 后端 API

**端点**: `POST /api/game/sync-local-data`

**请求头**:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**请求体**:
```json
{
  "localData": {
    "eggs": {
      "white": 5,
      "brown": 3,
      "silver": 1
    },
    "coins": 150,
    "upgrades": {
      "level": 2,
      "feed": 1,
      "clickPower": 1
    },
    "stats": {
      "totalClicks": 50,
      "totalEggsSold": 10
    },
    "blackPityCounter": 5
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "本地数据已同步到服务器"
  }
}
```

### 前端实现

在 `auth-simple.js` 中添加了 `syncLocalDataToServer()` 函数：

```javascript
async function syncLocalDataToServer(token) {
  // 1. 从 localStorage 读取本地游戏数据
  const savedData = localStorage.getItem('xiaoji_game_save');
  
  // 2. 检查是否有有效数据
  if (!savedData) return;
  
  // 3. 准备要同步的数据
  const localData = { eggs, coins, upgrades, stats, blackPityCounter };
  
  // 4. 调用同步 API
  await fetch('/api/game/sync-local-data', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ localData })
  });
}
```

### 触发时机

1. **用户登录时**（`handleLogin` 函数）
2. **用户注册时**（`handleRegister` 函数）

## 数据合并逻辑示例

### 场景 1: 纯新用户

**本地数据**:
```json
{
  "eggs": { "white": 10, "brown": 5 },
  "coins": 200
}
```

**服务器数据**: 空（新账号）

**合并结果**:
```json
{
  "eggs": { "white": 10, "brown": 5 },
  "coins": 200
}
```

### 场景 2: 已有服务器数据

**本地数据**:
```json
{
  "eggs": { "white": 5, "brown": 15 },
  "coins": 100,
  "upgrades": { "level": 3 }
}
```

**服务器数据**:
```json
{
  "eggs": { "white": 10, "brown": 5 },
  "coins": 200,
  "upgrades": { "level": 2 }
}
```

**合并结果** (取更大值):
```json
{
  "eggs": { "white": 10, "brown": 15 },  // 各自取较大值
  "coins": 200,                           // 服务器更大
  "upgrades": { "level": 3 }              // 本地更大
}
```

### 场景 3: 统计数据累加

**本地统计**:
```json
{
  "totalClicks": 50,
  "totalEggsSold": 20
}
```

**服务器统计**:
```json
{
  "totalClicks": 100,
  "totalEggsSold": 30
}
```

**合并结果** (累加):
```json
{
  "totalClicks": 150,
  "totalEggsSold": 50
}
```

## 测试验证

请参考 [test-sync-flow.md](../api/test-sync-flow.md) 文件中的详细测试步骤。

## 已知限制

1. **单向同步**：目前只支持本地 → 服务器，不支持服务器 → 本地
2. **多设备冲突**：如果用户在多个设备上同时游戏，可能会出现数据不一致
3. **一次性同步**：登录时只同步一次，登录后的本地修改不会自动同步

## 未来改进方向

1. **实时同步**：游戏状态改变时自动同步到服务器
2. **双向同步**：登录时从服务器拉取最新数据
3. **冲突解决**：智能检测并解决多设备数据冲突
4. **增量同步**：只同步变化的数据，减少网络流量
5. **离线队列**：网络异常时将同步请求放入队列，网络恢复后重试

## 相关文件

- **后端 API**: `api/src/routes/game.ts` (第 575-751 行)
- **前端同步**: `src/js/auth-simple.js` (第 253-317 行)
- **测试脚本**: `api/add-test-eggs.js`
- **测试文档**: `api/test-sync-flow.md`

## 日志示例

### 前端日志

```
[同步] 开始同步本地数据到服务器...
{eggs: {white: 5, brown: 3}, coins: 150, ...}
[同步] 本地数据同步成功！
```

### 后端日志

```
[Sync Local Data] User: 2d068dd4-d9c8-4b0f-8761-4372b5fd1d8f
[Sync Local Data] Local data: { eggs: {...}, coins: 200, ... }
[Sync] Updated brown eggs: 15
[Sync] Updated coins: 200
[Sync] Updated level level: 3
[Sync] Updated stats: { total_clicks: 150, total_eggs_sold: 50 }
[Sync Local Data] Sync completed successfully
```

## 故障排查

### 问题 1: 同步失败，返回 401

**原因**: Token 无效或已过期

**解决**: 
- 检查 `localStorage.getItem('auth_token')` 是否存在
- 重新登录获取新 token

### 问题 2: 同步后数据不对

**原因**: 可能是合并逻辑问题

**解决**:
- 检查后端日志，查看实际合并的数值
- 使用 `add-test-eggs.js` 手动设置测试数据
- 清空服务器数据重新测试

### 问题 3: 登录后库存还是 0

**原因**: 本地数据可能为空，或同步失败

**解决**:
1. 在浏览器控制台检查本地数据：
   ```js
   JSON.parse(localStorage.getItem('xiaoji_game_save'))
   ```
2. 检查前端控制台是否有同步日志
3. 检查后端日志是否有错误信息
4. 手动给用户添加测试数据：
   ```bash
   node api/add-test-eggs.js <nickname>
   ```

---

**最后更新**: 2025-01-10
**作者**: AI Assistant
