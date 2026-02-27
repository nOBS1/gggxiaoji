# 测试本地数据同步功能

## 测试场景

测试用户登录时，本地游戏数据是否正确同步到服务器账号。

## 测试步骤

### 1. 准备测试环境

1. **清空服务器数据**（可选）：
   ```js
   // 在浏览器控制台执行，清空用户 "1" 的数据
   node add-test-eggs.js 1  // 然后手动设置为 0
   ```

2. **准备本地游戏数据**：
   在浏览器中打开游戏（未登录状态），玩几局：
   - 点击小鸡几次，获得一些蛋
   - 卖出一些蛋，获得金币
   - 购买一些升级
   
3. **检查本地数据**：
   在浏览器控制台执行：
   ```js
   JSON.parse(localStorage.getItem('xiaoji_game_save'))
   ```
   
   应该看到类似这样的数据：
   ```json
   {
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
     "totalClicks": 50,
     "totalEggsSold": 10
   }
   ```

### 2. 测试登录同步

1. **点击登录按钮**
2. **输入账号**：例如 `1@123.com` / `123456`
3. **观察控制台日志**：
   ```
   [同步] 开始同步本地数据到服务器...
   [Sync] Updated brown eggs: 3
   [Sync] Updated coins: 150
   ...
   [同步] 本地数据同步成功！
   ```

4. **验证服务器数据**：
   登录成功后，刷新页面，检查游戏数据是否保留：
   - 库存中应该有之前获得的蛋
   - 金币数量应该正确
   - 升级等级应该正确

### 3. 验证合并逻辑

测试场景：服务器已有一些数据，本地也有数据，登录后应该合并（取更大值）。

1. **在服务器添加一些数据**：
   ```bash
   node add-test-eggs.js 1
   ```
   这会给用户添加 10 个 brown 蛋和 5 个 white 蛋

2. **在本地准备不同的数据**：
   在浏览器控制台设置：
   ```js
   const localData = {
     eggs: { white: 3, brown: 15, silver: 5 },
     coins: 200,
     upgrades: { level: 3, feed: 2 },
     totalClicks: 100
   };
   localStorage.setItem('xiaoji_game_save', JSON.stringify(localData));
   ```

3. **登录并观察合并结果**：
   - `white` 应该是 5（服务器）> 3（本地）
   - `brown` 应该是 15（本地）> 10（服务器）
   - `silver` 应该是 5（本地新增）
   - `coins` 应该是 200（本地）
   - `totalClicks` 应该是 100（累加，如果服务器有50，结果应该是 150）

### 4. 检查后端日志

后端应该输出类似这样的日志：
```
[Sync Local Data] User: 2d068dd4-d9c8-4b0f-8761-4372b5fd1d8f
[Sync Local Data] Local data: { eggs: {...}, coins: 200, ... }
[Sync] Updated brown eggs: 15
[Sync] Updated silver eggs: 5
[Sync] Updated coins: 200
[Sync] Updated level level: 3
[Sync] Updated stats: { total_clicks: 150 }
[Sync Local Data] Sync completed successfully
```

## 预期结果

✅ 登录成功后，本地游戏数据应该自动同步到服务器
✅ 如果服务器已有数据，应该智能合并（库存和金币取更大值，统计数据累加）
✅ 刷新页面后数据仍然存在
✅ 可以正常创建市场订单（因为库存已同步）

## 已知问题

- 目前的同步是**单向**的（本地 → 服务器），不会从服务器下载数据覆盖本地
- 如果用户在多个设备登录，可能会出现数据不一致
- 建议后续实现**双向同步**和**冲突解决机制**

## 回归测试

确保修改没有破坏现有功能：

1. ✅ 未登录状态下，游戏应该正常运行（纯本地存储）
2. ✅ 登录后，游戏状态应该从服务器加载
3. ✅ 退出登录后，游戏应该切换回本地存储
4. ✅ 注册新账号后，应该也同步本地数据
