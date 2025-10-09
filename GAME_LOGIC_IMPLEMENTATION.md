# 游戏核心业务逻辑实现总结

## 概述

本次开发完成了后端游戏核心业务逻辑的实现，包括点击、卖出、升级和任务系统。所有逻辑均基于前端配置文件（`src/js/config.js` 和 `src/js/gameLogic.js`）中定义的游戏规则。

---

## 已完成功能

### 1. **游戏逻辑工具函数** (`api/src/utils/gameLogic.ts`)

创建了一个集中管理的游戏逻辑工具库，包含：

#### 游戏配置常量 (GAME_CONFIG)
- **稀有度定义**: 白蛋、褐蛋、银蛋、金蛋、紫蛋、黑蛋的价格和权重
- **升级配置**: 7种升级类型的成本、最大等级和基础数值
- **任务配置**: 每日任务的目标和奖励

#### 核心计算函数
- `safeAdd()` - 安全数值增加（防止溢出）
- `getClickPower()` - 计算点击力量（基础值20 + 等级×5）
- `calculateWeights()` - 计算掉落权重（考虑等级、饲料、幸运加成）
- `rollEgg()` - 掉落蛋逻辑（基于权重和保底机制）
- `calculateSellValue()` - 计算卖出金币（含金币加成）
- `calculateUpgradeCost()` - 计算升级成本（蛋或金币）
- `canAffordUpgrade()` - 检查是否可以升级
- `isTaskCompleted()` - 检查任务是否完成
- `getTaskReward()` - 获取任务奖励

---

### 2. **POST /api/game/click** - 点击逻辑

**功能**: 处理用户点击，增加进度，触发掉落

**流程**:
1. 获取用户升级信息（clickPower等级）
2. 计算点击力量并增加 `peck_progress`
3. 如果进度 ≥ 100，触发掉落逻辑：
   - 基于等级、饲料、幸运加成计算权重
   - 随机掉落一个蛋（保底机制：1000次必出黑蛋）
   - 更新库存和保底计数器
4. 更新统计数据（总点击次数）
5. 更新每日任务进度（daily_click）

**返回数据**:
```json
{
  "success": true,
  "data": {
    "progress": 25,
    "droppedEgg": "silver"
  }
}
```

---

### 3. **POST /api/game/sell** - 卖出逻辑

**功能**: 卖出指定稀有度的蛋，获得金币

**请求参数**:
```json
{
  "rarity": "white",
  "quantity": 10
}
```

**流程**:
1. 验证输入（稀有度和数量）
2. 检查库存是否足够
3. 获取 `goldBonus` 升级等级
4. 计算金币收益（基础价格 × 数量 × 金币加成）
5. 更新库存和金币
6. 更新统计数据（总卖出数量）
7. 如果卖出银蛋，更新每日任务进度（daily_sell）

**金币计算公式**:
```
金币 = 基础价格 × 数量 × (1 + goldBonusLevel × 0.1)
```

**返回数据**:
```json
{
  "success": true,
  "data": {
    "coinsEarned": 120,
    "newBalance": 1520
  }
}
```

---

### 4. **POST /api/game/upgrade** - 升级逻辑

**功能**: 升级指定类型（等级、饲料、点击力量等）

**请求参数**:
```json
{
  "upgradeKey": "clickPower"
}
```

**升级类型**:
- **蛋升级**: `level`, `feed`, `clickPower`, `idleRate`
- **金币升级**: `luckyChance`, `autoSell`, `goldBonus`

**流程**:
1. 验证升级类型
2. 获取当前升级等级
3. 检查是否达到最高等级
4. 计算升级成本：
   - 蛋升级: `baseCost × 1.5^currentLevel`
   - 金币升级: `baseCost × 1.8^currentLevel`
5. 检查资源是否足够
6. 扣除资源（蛋或金币）
7. 提升等级

**返回数据**:
```json
{
  "success": true,
  "data": {
    "upgradeKey": "clickPower",
    "newLevel": 3
  }
}
```

---

### 5. **POST /api/game/claim-task** - 领取任务奖励

**功能**: 领取每日任务奖励（金币）

**请求参数**:
```json
{
  "taskKey": "daily_click"
}
```

**任务类型**:
- `daily_click`: 点击100次，奖励50金币
- `daily_sell`: 卖出3个银蛋，奖励100金币

**流程**:
1. 验证任务键值
2. 获取今日任务进度
3. 检查是否已领取
4. 验证任务是否完成
5. 更新 `claimed` 状态为 true
6. 发放金币奖励

**返回数据**:
```json
{
  "success": true,
  "data": {
    "taskKey": "daily_click",
    "reward": 50,
    "newBalance": 1050
  }
}
```

---

## 游戏机制说明

### 掉落系统

#### 权重计算
1. **基础权重**:
   - 白蛋: 8200
   - 褐蛋: 1200
   - 银蛋: 430
   - 金蛋: 130
   - 紫蛋: 35
   - 黑蛋: 5

2. **等级影响**: 从白蛋权重转移到其他蛋
   - 每级转移 60 权重，最多1200
   - 分配: 褐35% / 银30% / 金20% / 紫10% / 黑5%

3. **饲料影响**: 提升高级蛋权重
   - 高级饲料（Tier 1）: 银/金/紫/黑 ×1.12
   - 顶级饲料（Tier 2）: 银/金/紫/黑 ×1.30

4. **幸运加成**: 每级+5%稀有蛋权重
   - 影响褐/银/金/紫/黑蛋

5. **保底机制**: 1000次未出黑蛋，必出黑蛋

### 升级系统

#### 成本公式
- **蛋升级**: `baseCost × 1.5^level`
- **金币升级**: `baseCost × 1.8^level`

#### 升级效果
| 升级类型 | 效果 | 最大等级 |
|---------|------|---------|
| level | 提升稀有蛋掉落概率 | 20 |
| feed | 提升高级蛋掉落权重 | 2 |
| clickPower | 每次点击+5进度 | 10 |
| idleRate | 挂机效率+0.2蛋/分钟 | 20 |
| luckyChance | 稀有蛋掉落率+5% | 15 |
| autoSell | 自动售卖白蛋 | 10 |
| goldBonus | 卖蛋金币+10% | 20 |

### 任务系统

#### 每日任务
- **点击任务**: 点击100次 → 奖励50金币
- **卖出任务**: 卖出3个银蛋 → 奖励100金币

#### 重置机制
- 每日00:00重置任务进度
- 已完成但未领取的奖励会保留

---

## 数据库交互

### 使用的表
1. **profiles**: 用户配置（金币、进度、保底计数器）
2. **inventory**: 库存（各稀有度蛋的数量）
3. **upgrades**: 升级等级
4. **stats**: 统计数据（总点击、总卖出）
5. **daily_tasks**: 每日任务进度

### 事务安全
所有涉及资源变更的操作都使用 Supabase 的原子操作，确保数据一致性。

---

## 前后端对应

| 前端逻辑 | 后端 API | 实现状态 |
|---------|---------|---------|
| handleClick() | POST /api/game/click | ✅ 已完成 |
| sellEgg() | POST /api/game/sell | ✅ 已完成 |
| doUpgrade() | POST /api/game/upgrade | ✅ 已完成 |
| claimTask() | POST /api/game/claim-task | ✅ 已完成 |
| processPassiveIncome() | - | ⏳ 待实现（挂机产出） |
| watchAd() | - | ⏳ 待实现（广告奖励） |

---

## 下一步计划

### 待实现功能
1. **挂机产出系统** (Idle Income)
   - 计算离线收益
   - 自动售卖白蛋（基于 autoSell 等级）

2. **市场交易系统** (Market)
   - 创建挂单 (POST /api/market/create)
   - 购买挂单 (POST /api/market/buy)
   - 取消挂单 (POST /api/market/cancel)

3. **排行榜系统** (Leaderboard)
   - 获取排行榜 (GET /api/leaderboard)

4. **前端集成**
   - 更新前端 API 调用，对接后端接口
   - 添加错误处理和加载状态
   - 国际化支持（中英文）

### 测试计划
1. 单元测试（游戏逻辑工具函数）
2. 集成测试（API 端点）
3. 压力测试（高并发场景）
4. 边界测试（数值溢出、保底机制等）

---

## 技术栈

- **后端框架**: Hono.js
- **数据库**: Supabase PostgreSQL
- **运行环境**: Node.js
- **语言**: TypeScript

---

## 注意事项

1. **数值安全**: 所有数值增加都使用 `safeAdd()` 防止溢出（上限 1e15）
2. **输入验证**: 所有 API 都进行严格的输入验证
3. **错误处理**: 统一使用 `Errors` 枚举返回错误
4. **国际化**: 支持中英文（通过前端 i18n）

---

## 更新日志

**2025-10-10**
- ✅ 创建游戏逻辑工具函数库 (`gameLogic.ts`)
- ✅ 实现点击逻辑 (POST /api/game/click)
- ✅ 实现卖出逻辑 (POST /api/game/sell)
- ✅ 实现升级逻辑 (POST /api/game/upgrade)
- ✅ 实现任务领取逻辑 (POST /api/game/claim-task)
- 📝 完成实现文档

---

## 联系方式

如有问题或需要进一步开发，请联系开发团队。
