# 🏗️ 前后端分离架构迁移分析

**日期**: 2025-10-08  
**当前版本**: v2.1.1 (纯前端)  
**目标版本**: v3.0 (前后端分离)

---

## 📊 目录

1. [当前代码结构分析](#当前代码结构分析)
2. [数据映射关系](#数据映射关系)
3. [模块迁移方案](#模块迁移方案)
4. [API 设计建议](#api-设计建议)
5. [前端改造方案](#前端改造方案)
6. [迁移难度评估](#迁移难度评估)
7. [实施路线图](#实施路线图)

---

## 1️⃣ 当前代码结构分析

### 📁 现有模块（6个核心文件）

```
src/js/
├── config.js       ✅ 配置常量（可复用）
├── state.js        🔄 状态管理（需重构）
├── gameLogic.js    🔄 游戏逻辑（需拆分）
├── ui.js           ✅ UI更新（前端保留）
├── i18n.js         ✅ 国际化（前端保留）
└── main.js         🔄 主入口（需改造）
```

### 🎯 状态数据结构（state.js）

**当前 localStorage 存储的完整状态：**

```javascript
DEFAULT_STATE = {
  // 🥚 库存数据 → 迁移到 inventory 表
  eggs: { 
    white: 0, brown: 0, silver: 0, 
    gold: 0, purple: 0, black: 0 
  },
  
  // 💰 金币 → 迁移到 profiles 表
  coins: 0,
  
  // ⬆️ 升级数据 → 迁移到 upgrades 表
  upgrades: { 
    level: 1, feed: 0, clickPower: 0, 
    idleRate: 0, luckyChance: 0, 
    autoSell: 0, goldBonus: 0 
  },
  
  // 📊 游戏进度 → 迁移到 stats 表
  peckProgress: 0,
  idleEggAccumulator: 0,
  lastIdleTick: Date.now(),
  totalClicks: 0,
  totalEggsSold: 0,
  blackPityCounter: 0,
  
  // 📺 广告系统 → 迁移到 ad_runs 表
  adCooldown: 0,
  adWatchedToday: 0,
  lastAdDate: null,
  
  // 🎯 任务系统 → 迁移到 daily_tasks 表
  dailyTasks: { 
    clicks: 0, 
    sellSilver: 0,
    clickTaskClaimed: false,
    sellTaskClaimed: false
  },
  
  // ⚙️ 用户偏好 → 迁移到 profiles 表
  soundEnabled: true,
  language: 'zh',
  
  // 🎮 临时状态（不存储）
  isKeyPressed: false
}
```

---

## 2️⃣ 数据映射关系

### 📊 状态字段 → 数据库表映射

| 前端字段 | 当前类型 | 数据库表 | 数据库字段 | 备注 |
|---------|---------|---------|-----------|------|
| `eggs.white` | number | `inventory` | `user_id, rarity='white', quantity` | 按稀有度拆分行 |
| `eggs.brown` | number | `inventory` | `user_id, rarity='brown', quantity` | 同上 |
| `eggs.silver` | number | `inventory` | `user_id, rarity='silver', quantity` | 同上 |
| `eggs.gold` | number | `inventory` | `user_id, rarity='gold', quantity` | 同上 |
| `eggs.purple` | number | `inventory` | `user_id, rarity='purple', quantity` | 同上 |
| `eggs.black` | number | `inventory` | `user_id, rarity='black', quantity` | 同上 |
| `coins` | number | `profiles` | `coins` | 用户金币余额 |
| `upgrades.level` | number | `upgrades` | `user_id, upgrade_key='level', level` | 按升级类型拆分行 |
| `upgrades.feed` | number | `upgrades` | `user_id, upgrade_key='feed', level` | 同上 |
| `upgrades.clickPower` | number | `upgrades` | `user_id, upgrade_key='clickPower', level` | 同上 |
| `upgrades.idleRate` | number | `upgrades` | `user_id, upgrade_key='idleRate', level` | 同上 |
| `upgrades.luckyChance` | number | `upgrades` | `user_id, upgrade_key='luckyChance', level` | 同上 |
| `upgrades.autoSell` | number | `upgrades` | `user_id, upgrade_key='autoSell', level` | 同上 |
| `upgrades.goldBonus` | number | `upgrades` | `user_id, upgrade_key='goldBonus', level` | 同上 |
| `peckProgress` | number | `stats` | `peck_progress` | 游戏进度 |
| `idleEggAccumulator` | number | `stats` | `idle_accumulator` | 离线累积器 |
| `lastIdleTick` | timestamp | `stats` | `last_idle_tick` | 最后挂机时间 |
| `totalClicks` | number | `stats` | `total_clicks` | 总点击数 |
| `totalEggsSold` | number | `stats` | `total_eggs_sold` | 总售卖数 |
| `blackPityCounter` | number | `stats` | `black_pity_counter` | 保底计数器 |
| `adCooldown` | number | `ad_runs` | `cooldown` | 广告冷却 |
| `adWatchedToday` | number | `ad_runs` | `watched_today` | 今日观看数 |
| `lastAdDate` | string | `ad_runs` | `last_date` | 最后日期 |
| `dailyTasks.clicks` | number | `daily_tasks` | `user_id, task_key='daily_click', progress` | 按任务拆分行 |
| `dailyTasks.sellSilver` | number | `daily_tasks` | `user_id, task_key='daily_sell', progress` | 同上 |
| `dailyTasks.clickTaskClaimed` | boolean | `daily_tasks` | `user_id, task_key='daily_click', claimed` | 同上 |
| `dailyTasks.sellTaskClaimed` | boolean | `daily_tasks` | `user_id, task_key='daily_sell', claimed` | 同上 |
| `soundEnabled` | boolean | `profiles` | `sound_enabled` | 用户偏好 |
| `language` | string | `profiles` | `language` | 用户语言 |

---

## 3️⃣ 模块迁移方案

### 🔹 config.js - 配置模块

**迁移难度**: ⭐ 极简单

**当前状态**: 纯静态配置，无副作用

**迁移方案**:
- ✅ **前端保留**: 继续使用，用于UI渲染和本地计算
- ✅ **后端复用**: 复制到后端，用于服务端验证和计算
- ⚠️ **注意**: 前后端配置需保持同步

```javascript
// 前端: src/js/config.js (保持不变)
export const CONFIG = { ... }

// 后端: api/config.js (复制一份)
export const CONFIG = { ... }
```

---

### 🔹 state.js - 状态管理模块

**迁移难度**: ⭐⭐⭐⭐⭐ 复杂（核心重构）

**当前功能**:
1. ✅ 定义默认状态
2. ✅ localStorage 读写
3. ✅ 数据验证（safeLoadData）
4. ✅ 原型污染防护

**迁移方案**:

#### Phase 1: 添加 API 层（保留 localStorage）

```javascript
// src/js/api.js (新建)
export class GameAPI {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
    this.token = localStorage.getItem('auth_token');
  }

  async fetchState() {
    const response = await fetch(`${this.baseUrl}/state`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await response.json();
  }

  async saveState(state) {
    await fetch(`${this.baseUrl}/state`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });
  }

  async click() {
    const response = await fetch(`${this.baseUrl}/click`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await response.json();
  }

  // ... 其他 API 方法
}
```

#### Phase 2: 改造 state.js

```javascript
// src/js/state.js (改造后)
import { GameAPI } from './api.js';

// 添加用户状态
export const userState = {
  isLoggedIn: false,
  userId: null,
  token: null,
  mode: 'local' // 'local' | 'cloud'
};

// state 变为缓存层
export const state = { 
  ...DEFAULT_STATE,
  _isSync: false,  // 是否已同步
  _isDirty: false  // 是否有未保存更改
};

// 改造保存逻辑
export async function saveGame() {
  if (state.isResetting) return;
  
  // 本地模式：保存到 localStorage
  if (userState.mode === 'local') {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
    return;
  }
  
  // 云端模式：保存到服务器
  if (userState.isLoggedIn && state._isDirty) {
    try {
      const api = new GameAPI();
      await api.saveState(state);
      state._isDirty = false;
      state._isSync = true;
    } catch (error) {
      console.error('云端保存失败，回退到本地', error);
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
    }
  }
}

// 改造加载逻辑
export async function loadGame() {
  // 检查是否登录
  const token = localStorage.getItem('auth_token');
  if (token) {
    userState.isLoggedIn = true;
    userState.token = token;
    userState.mode = 'cloud';
    
    try {
      // 从云端加载
      const api = new GameAPI();
      const cloudState = await api.fetchState();
      Object.assign(state, cloudState);
      state._isSync = true;
      return;
    } catch (error) {
      console.error('云端加载失败，尝试本地存档', error);
    }
  }
  
  // 未登录或云端失败：加载本地存档
  userState.mode = 'local';
  const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    const safeData = safeLoadData(data);
    if (safeData) {
      Object.assign(state, safeData);
    }
  }
}

// 数据验证逻辑保留（用于本地模式）
function safeLoadData(data) { /* 现有代码保留 */ }
```

---

### 🔹 gameLogic.js - 游戏逻辑模块

**迁移难度**: ⭐⭐⭐⭐ 困难（需拆分）

**当前功能**:
1. ✅ 掉落系统（rollEgg, dropEgg）
2. ✅ 点击系统（handleClick）
3. ✅ 商店系统（sellEgg）
4. ✅ 升级系统（doUpgrade）
5. ✅ 任务系统（getTasks, claimTask）
6. ✅ 广告系统（watchAd）
7. ✅ 被动收益（processPassiveIncome）

**迁移方案**: 按功能拆分前后端

#### 🔵 保留在前端的逻辑（UI 相关）

```javascript
// src/js/gameLogic.client.js
// 仅保留 UI 交互和本地计算

export function getIdleRate() {
  // 前端显示用的计算
  return CONFIG.UPGRADES.idleRate.baseValue + (state.upgrades.idleRate * 0.2);
}

export function getClickPower() {
  // 前端显示用的计算
  return CONFIG.UPGRADES.clickPower.baseValue + state.upgrades.clickPower * 5;
}

export function calculateWeights() {
  // 前端显示用（仅供参考）
  // 实际掉落由后端计算
}
```

#### 🟢 迁移到后端的逻辑（防作弊）

```javascript
// api/gameLogic.server.js
// 所有关键计算和状态修改

export async function handleClick(userId) {
  // 服务端验证和计算
  const user = await db.getUser(userId);
  const power = calculateClickPower(user.upgrades);
  
  await db.transaction(async (trx) => {
    // 更新进度
    await trx('stats')
      .where({ user_id: userId })
      .increment('peck_progress', power);
    
    // 检查是否产蛋
    const stats = await trx('stats').where({ user_id: userId }).first();
    if (stats.peck_progress >= 100) {
      await trx('stats')
        .where({ user_id: userId })
        .decrement('peck_progress', 100);
      
      // 掉落鸡蛋
      const rarity = rollEgg(user);
      await trx('inventory')
        .where({ user_id: userId, rarity })
        .increment('quantity', 1);
      
      return { success: true, dropped: rarity };
    }
  });
  
  return { success: true, progress: power };
}

export async function sellEgg(userId, rarity, amount) {
  // 服务端验证库存和计算金币
  return await db.transaction(async (trx) => {
    const inventory = await trx('inventory')
      .where({ user_id: userId, rarity })
      .first();
    
    if (!inventory || inventory.quantity < amount) {
      throw new Error('库存不足');
    }
    
    // 扣除鸡蛋
    await trx('inventory')
      .where({ user_id: userId, rarity })
      .decrement('quantity', amount);
    
    // 计算金币（含加成）
    const baseCoins = CONFIG.RARITIES[rarity].price * amount;
    const bonus = await getGoldBonus(trx, userId);
    const coins = Math.floor(baseCoins * bonus);
    
    // 增加金币
    await trx('profiles')
      .where({ user_id: userId })
      .increment('coins', coins);
    
    return { success: true, coins };
  });
}
```

---

### 🔹 ui.js - UI更新模块

**迁移难度**: ⭐⭐ 简单

**当前功能**: 纯UI渲染，无副作用

**迁移方案**:
- ✅ **前端完全保留**: 所有UI逻辑不变
- 🔄 **数据来源改变**: 从 API 响应而非直接修改 state

```javascript
// src/js/ui.js (改造后)
// UI 逻辑保持不变，只是数据来源改为 API

export async function updateInventory() {
  // 原来: 直接读取 state.eggs
  // 现在: 如果是云端模式，从 API 获取最新数据
  
  if (userState.mode === 'cloud' && !state._isSync) {
    const api = new GameAPI();
    const freshState = await api.fetchState();
    Object.assign(state, freshState);
  }
  
  // UI 渲染逻辑保持不变
  const grid = document.getElementById('inventoryGrid');
  // ... 现有代码
}
```

---

### 🔹 i18n.js - 国际化模块

**迁移难度**: ⭐ 极简单

**迁移方案**:
- ✅ **前端完全保留**: 纯静态翻译文本
- ✅ **无需改动**: 保持现状即可

---

### 🔹 main.js - 主入口模块

**迁移难度**: ⭐⭐⭐ 中等

**迁移方案**: 添加认证流程

```javascript
// src/js/main.js (改造后)

import { loadGame, saveGame, userState } from './state.js';
import { GameAPI } from './api.js';

// 页面加载时
window.addEventListener('DOMContentLoaded', async () => {
  // 1. 检查登录状态
  await checkAuth();
  
  // 2. 加载游戏数据
  await loadGame();
  
  // 3. 计算离线收益
  if (userState.isLoggedIn) {
    await calculateOfflineEarnings();
  } else {
    calculateOfflineEarningsLocal();
  }
  
  // 4. 初始化UI
  initUI();
  
  // 5. 启动定时器
  startTimers();
});

async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const api = new GameAPI();
      const user = await api.verifyToken();
      userState.isLoggedIn = true;
      userState.userId = user.id;
      userState.token = token;
      
      // 显示用户信息
      showUserInfo(user);
    } catch (error) {
      // Token 无效，清除
      localStorage.removeItem('auth_token');
      userState.isLoggedIn = false;
    }
  }
}

// 点击事件改造
chickenImg.addEventListener('click', async (e) => {
  if (userState.mode === 'cloud') {
    // 云端模式：调用 API
    const api = new GameAPI();
    const result = await api.click();
    
    // 更新本地缓存
    state.peckProgress = result.progress;
    if (result.dropped) {
      state.eggs[result.dropped]++;
      showFloatText(e.clientX, e.clientY, `+1 ${CONFIG.RARITIES[result.dropped].emoji}`);
    }
    updateAllDisplays();
  } else {
    // 本地模式：原有逻辑
    handleClick(e.clientX, e.clientY);
  }
});
```

---

## 4️⃣ API 设计建议

### 🌐 RESTful API 端点

基于现有 state.js 和 gameLogic.js 的功能，设计以下 API：

#### 🔐 认证相关

```
POST   /auth/register          注册账号
POST   /auth/login             登录
POST   /auth/logout            登出
GET    /auth/verify            验证Token
POST   /auth/refresh           刷新Token
```

#### 🎮 游戏状态

```
GET    /state                  获取完整游戏状态
POST   /state                  保存游戏状态（批量更新）
PATCH  /state                  部分更新状态
```

#### 🥚 游戏操作

```
POST   /click                  点击操作
POST   /idle                   计算离线收益
GET    /inventory              获取库存
POST   /sell                   出售鸡蛋
```

#### ⬆️ 升级系统

```
GET    /upgrades               获取升级信息
POST   /upgrades/:key          执行升级
GET    /upgrades/:key/cost     查询升级成本
```

#### 🎯 任务系统

```
GET    /tasks                  获取任务列表
POST   /tasks/:id/claim        领取任务奖励
GET    /tasks/:id              查询任务进度
```

#### 📺 广告系统

```
POST   /ads/watch              观看广告
GET    /ads/status             查询广告状态
```

#### 💰 交易系统（新功能）

```
GET    /orders                 获取订单列表
POST   /orders                 创建订单
POST   /orders/:id/buy         购买订单
POST   /orders/:id/cancel      取消订单
GET    /orders/:id             查询订单详情
GET    /transactions           查询交易历史
```

---

### 📋 API 请求/响应示例

#### 示例 1: 点击操作

**请求**:
```http
POST /click
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{}
```

**响应**:
```json
{
  "success": true,
  "progress": 25,
  "dropped": null,
  "state": {
    "peckProgress": 25,
    "totalClicks": 101
  }
}
```

如果掉落了鸡蛋：
```json
{
  "success": true,
  "progress": 0,
  "dropped": "gold",
  "state": {
    "peckProgress": 0,
    "totalClicks": 102,
    "eggs": {
      "gold": 5
    }
  }
}
```

#### 示例 2: 出售鸡蛋

**请求**:
```http
POST /sell
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "rarity": "silver",
  "amount": 10
}
```

**响应**:
```json
{
  "success": true,
  "coins": 50,
  "state": {
    "coins": 1050,
    "eggs": {
      "silver": 15
    },
    "dailyTasks": {
      "sellSilver": 10
    }
  }
}
```

#### 示例 3: 获取完整状态

**请求**:
```http
GET /state
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**响应**:
```json
{
  "eggs": {
    "white": 100,
    "brown": 50,
    "silver": 25,
    "gold": 5,
    "purple": 2,
    "black": 1
  },
  "coins": 1050,
  "upgrades": {
    "level": 8,
    "feed": 1,
    "clickPower": 5,
    "idleRate": 10,
    "luckyChance": 3,
    "autoSell": 2,
    "goldBonus": 4
  },
  "stats": {
    "peckProgress": 25,
    "totalClicks": 1523,
    "totalEggsSold": 456,
    "blackPityCounter": 235,
    "lastIdleTick": 1696752000000
  },
  "dailyTasks": {
    "daily_click": {
      "progress": 50,
      "claimed": false
    },
    "daily_sell": {
      "progress": 2,
      "claimed": false
    }
  },
  "ads": {
    "cooldown": 0,
    "watchedToday": 3
  },
  "profile": {
    "soundEnabled": true,
    "language": "zh"
  }
}
```

---

## 5️⃣ 前端改造方案

### 📝 文件结构（改造后）

```
src/js/
├── config.js           ✅ 保留不变
├── api.js              🆕 新增 API 封装
├── auth.js             🆕 新增认证逻辑
├── state.js            🔄 改造为缓存层
├── gameLogic.client.js 🔄 拆分出前端逻辑
├── ui.js               ✅ 基本保留
├── i18n.js             ✅ 保留不变
└── main.js             🔄 添加认证流程
```

### 🎯 关键改造点

#### 1. 添加登录/注册界面

```html
<!-- index.html -->
<div id="authModal" class="modal">
  <div class="modal-content">
    <h2 data-i18n="loginTitle">登录/注册</h2>
    <form id="loginForm">
      <input type="email" id="email" placeholder="邮箱" required />
      <input type="password" id="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>
    <button id="switchToGuest">游客试玩</button>
  </div>
</div>
```

#### 2. 改造数据流

**原来**:
```
用户操作 → 修改 state → 更新 UI → localStorage
```

**改造后（云端模式）**:
```
用户操作 → API 请求 → 后端验证 → 返回新状态 → 更新本地缓存 → 更新 UI
```

**改造后（本地模式）**:
```
用户操作 → 修改 state → 更新 UI → localStorage
```

#### 3. 错误处理

```javascript
// src/js/api.js
export class GameAPI {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '请求失败');
      }
      
      return await response.json();
    } catch (error) {
      // 网络错误 → 回退到本地模式
      if (error.name === 'TypeError') {
        console.warn('网络错误，切换到本地模式');
        userState.mode = 'local';
        throw new Error('network_error');
      }
      
      // Token 过期 → 清除登录状态
      if (error.message === 'Unauthorized') {
        this.logout();
        throw new Error('auth_expired');
      }
      
      throw error;
    }
  }
}
```

---

## 6️⃣ 迁移难度评估

### 📊 各模块迁移难度矩阵

| 模块 | 代码行数 | 迁移难度 | 工作量 | 风险 | 优先级 |
|------|---------|---------|--------|------|--------|
| `config.js` | 79 | ⭐ | 0.5天 | 低 | P3 |
| `i18n.js` | ~200 | ⭐ | 0.5天 | 低 | P3 |
| `ui.js` | 291 | ⭐⭐ | 2天 | 低 | P2 |
| `state.js` | ~300 | ⭐⭐⭐⭐⭐ | 5天 | 高 | P0 |
| `gameLogic.js` | ~500 | ⭐⭐⭐⭐ | 4天 | 高 | P1 |
| `main.js` | ~200 | ⭐⭐⭐ | 3天 | 中 | P1 |
| **后端开发** | 0 | ⭐⭐⭐⭐⭐ | 10天 | 高 | P0 |
| **数据库设计** | 0 | ⭐⭐⭐⭐ | 3天 | 高 | P0 |
| **认证系统** | 0 | ⭐⭐⭐ | 3天 | 中 | P0 |
| **交易系统** | 0 | ⭐⭐⭐⭐⭐ | 7天 | 高 | P2 |

### ⏱️ 总工作量估算

| 阶段 | 任务 | 工作量 | 累计 |
|------|------|--------|------|
| **Phase 1** | 数据库设计 + 后端基础 | 13天 | 13天 |
| **Phase 2** | 前端改造 + API 集成 | 15天 | 28天 |
| **Phase 3** | 交易系统实现 | 7天 | 35天 |
| **Phase 4** | 测试 + 部署 + 文档 | 5天 | 40天 |
| **总计** | **完整迁移** | **40天** | - |

---

## 7️⃣ 实施路线图

### 🚀 分阶段实施计划

#### 📅 Phase 1: 后端基础 (Week 1-2)

**目标**: 搭建后端 API 和数据库

| 任务 | 输出 | 时间 |
|------|------|------|
| 数据库表设计 | SQL schema | 2天 |
| Supabase/D1 配置 | 数据库实例 | 1天 |
| 认证系统实现 | /auth/* APIs | 3天 |
| 核心 API 实现 | /state, /click, /sell | 5天 |
| API 文档编写 | OpenAPI spec | 2天 |

**里程碑**: 后端API可以响应基本请求

---

#### 📅 Phase 2: 前端改造 (Week 3-4)

**目标**: 前端接入 API，支持云端/本地双模式

| 任务 | 输出 | 时间 |
|------|------|------|
| 创建 api.js | API 封装类 | 2天 |
| 改造 state.js | 缓存层 | 3天 |
| 拆分 gameLogic.js | 前后端分离 | 2天 |
| 改造 main.js | 认证流程 | 2天 |
| 登录/注册 UI | 用户界面 | 2天 |
| 双模式切换 | 本地/云端 | 2天 |
| 测试本地存档迁移 | 迁移脚本 | 2天 |

**里程碑**: 游客可本地试玩，登录用户可云端存档

---

#### 📅 Phase 3: 交易系统 (Week 5)

**目标**: 实现人对人交易

| 任务 | 输出 | 时间 |
|------|------|------|
| 订单表设计 | SQL + API | 1天 |
| 订单 CRUD API | /orders/* | 2天 |
| 交易流程实现 | 购买/取消 | 2天 |
| 交易 UI | 商城界面 | 2天 |

**里程碑**: 用户可上架和购买鸡蛋

---

#### 📅 Phase 4: 测试与部署 (Week 6)

**目标**: 上线生产环境

| 任务 | 输出 | 时间 |
|------|------|------|
| 单元测试 | 测试覆盖 | 2天 |
| 集成测试 | E2E 测试 | 1天 |
| CI/CD 配置 | GitHub Actions | 1天 |
| 部署到生产 | 上线 | 1天 |

**里程碑**: v3.0 正式上线

---

### ⚠️ 风险与挑战

#### 🔴 高风险

1. **数据迁移**
   - 现有用户的 localStorage 数据如何迁移到云端
   - **解决方案**: 提供"导入本地存档"功能

2. **防作弊**
   - 后端逻辑必须完全验证前端请求
   - **解决方案**: 所有关键操作服务端计算

3. **性能**
   - API 调用延迟影响用户体验
   - **解决方案**: 本地缓存 + 乐观更新

#### 🟡 中风险

4. **成本**
   - Supabase/Cloudflare 免费额度是否够用
   - **解决方案**: 监控用量，必要时优化

5. **兼容性**
   - 旧版本用户如何平滑过渡
   - **解决方案**: 保留本地试玩模式

---

### 🎯 MVP 功能优先级

如果需要快速上线 MVP，建议优先级：

| 功能 | 优先级 | 是否必须 |
|------|--------|---------|
| 用户注册/登录 | P0 | ✅ 必须 |
| 云端存档 | P0 | ✅ 必须 |
| 本地试玩模式 | P0 | ✅ 必须 |
| 点击/升级/任务 | P0 | ✅ 必须 |
| 离线收益（后端） | P1 | ✅ 必须 |
| 交易系统 | P2 | ❌ 可后续 |
| 实时通知 | P3 | ❌ 可后续 |
| 排行榜 | P3 | ❌ 可后续 |

---

## ✅ 总结

### 🎯 关键要点

1. **数据映射清晰**: 现有 state 可完整映射到数据库表
2. **代码可复用**: config.js, i18n.js 无需改动
3. **渐进式迁移**: 支持本地/云端双模式，降低风险
4. **防作弊完善**: 关键逻辑迁移到后端
5. **工作量可控**: 预计 40 天完成完整迁移

### 📋 下一步行动

**建议按以下顺序执行**:

1. ✅ **阅读本分析报告** (完成)
2. 📝 **细化数据库表设计** (创建 SQL schema)
3. 🔧 **搭建后端开发环境** (Supabase/Cloudflare Workers)
4. 🌐 **实现核心 API** (认证 + 状态同步)
5. 🎨 **改造前端接入 API** (双模式支持)
6. 🧪 **测试与上线** (CI/CD + 监控)

---

**文档版本**: 1.0  
**最后更新**: 2025-10-08  
**作者**: AI Assistant
