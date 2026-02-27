# 代码优化建议报告

## 📊 分析概览

基于对项目代码的全面分析，发现以下需要优化的关键领域：

---

## 🟥 高优先级问题

### 1. **密码哈希安全性问题** ✅ 已修复

**位置**: `api/src/utils/crypto.ts`

**问题描述**:
目前使用 SHA-256 进行密码哈希，这对于密码存储是**极不安全**的。SHA-256 是快速哈希算法，容易被暴力破解和彩虹表攻击。

**当前代码**:
```typescript
// 使用 SHA-256 进行哈希（示例，生产环境应该使用 bcrypt）
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
```

**安全风险**:
- ❌ 无盐值（Salt）
- ❌ 快速计算，容易暴力破解
- ❌ 不符合密码存储最佳实践

**优化方案**:

#### 方案 A: 使用 bcrypt（推荐）
```typescript
import bcrypt from 'bcryptjs'; // 或 @cloudflare/workers-bcrypt

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
```

#### 方案 B: 使用 PBKDF2（Web Crypto API）
```typescript
const ITERATIONS = 100000;
const KEY_LENGTH = 256;

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltArray = Array.from(salt);
  
  // 组合 salt 和 hash
  return JSON.stringify({
    salt: btoa(String.fromCharCode(...saltArray)),
    hash: btoa(String.fromCharCode(...hashArray))
  });
};
```

**推荐**: 使用 `bcryptjs` 或 `@cloudflare/workers-bcrypt`

**✅ 修复状态**: 已完成（2025-10-09）
- 安装了 bcryptjs 依赖
- 更新 crypto.ts 使用 bcrypt
- 添加密码长度验证
- 添加密码强度检查
- 所有测试通过（7/7）
- 详细信息见 `SECURITY_FIX_REPORT.md`

---

### 2. **多次数据库查询优化** ⚡ 性能

**位置**: `api/src/routes/game.ts` (多个接口)

**问题描述**:
许多接口进行了多次独立的数据库查询，可以通过批量查询和事务优化性能。

#### 问题 A: 点击接口 (POST /api/game/click)
```typescript
// ❌ 多次独立查询
const { data: profile } = await supabase.from('profiles').select('*')...
const { data: upgrades } = await supabase.from('upgrades').select()...
const { data: existingItem } = await supabase.from('inventory').select()...
const { data: stats } = await supabase.from('stats').select()...
const { data: task } = await supabase.from('daily_tasks').select()...
```

**优化方案**:
```typescript
// ✅ 使用 Promise.all 并行查询
const [
  { data: profile },
  { data: upgrades },
  { data: stats }
] = await Promise.all([
  supabase.from('profiles').select('*').eq('user_id', user.userId).single(),
  supabase.from('upgrades').select('upgrade_key, level').eq('user_id', user.userId),
  supabase.from('stats').select('*').eq('user_id', user.userId).single()
]);
```

#### 问题 B: 升级接口循环更新
```typescript
// ❌ 循环中执行多次更新
for (const [rarity, amount] of Object.entries(cost)) {
  await supabase
    .from('inventory')
    .update({ quantity: inventoryMap[rarity] - amount })
    .eq('user_id', user.userId)
    .eq('rarity', rarity);
}
```

**优化方案**:
```typescript
// ✅ 使用 RPC 函数批量更新
await supabase.rpc('update_inventory_batch', {
  user_id: user.userId,
  updates: Object.entries(cost).map(([rarity, amount]) => ({
    rarity,
    quantity_delta: -amount
  }))
});

// 或使用 Promise.all
await Promise.all(
  Object.entries(cost).map(([rarity, amount]) =>
    supabase
      .from('inventory')
      .update({ quantity: inventoryMap[rarity] - amount })
      .eq('user_id', user.userId)
      .eq('rarity', rarity)
  )
);
```

---

### 3. **缺少数据库事务支持** 🔒 数据一致性

**位置**: `api/src/routes/game.ts` (所有涉及资源变更的接口)

**问题描述**:
涉及多步骤资源变更的操作（如升级、卖出、点击掉落）没有使用事务，可能导致数据不一致。

**风险场景**:
```typescript
// 场景：玩家升级
// 1. 扣除金币 ✅
// 2. 提升等级 ❌ (网络错误)
// 结果：金币被扣，但等级没升 → 玩家损失
```

**优化方案**:

由于 Supabase 不直接支持客户端事务，需要使用以下方案：

#### 方案 A: 使用 PostgreSQL RPC 函数（推荐）
```sql
-- 创建原子性升级函数
CREATE OR REPLACE FUNCTION upgrade_user_level(
  p_user_id TEXT,
  p_upgrade_key TEXT,
  p_cost_coins INT
) RETURNS JSON AS $$
DECLARE
  v_current_level INT;
  v_result JSON;
BEGIN
  -- 开始事务
  BEGIN
    -- 检查金币
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = p_user_id AND coins >= p_cost_coins
    ) THEN
      RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- 扣除金币
    UPDATE profiles 
    SET coins = coins - p_cost_coins 
    WHERE user_id = p_user_id;
    
    -- 提升等级
    INSERT INTO upgrades (user_id, upgrade_key, level)
    VALUES (p_user_id, p_upgrade_key, 1)
    ON CONFLICT (user_id, upgrade_key)
    DO UPDATE SET level = upgrades.level + 1
    RETURNING level INTO v_current_level;
    
    -- 返回结果
    v_result := json_build_object(
      'success', true,
      'new_level', v_current_level
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// TypeScript 调用
const { data, error } = await supabase.rpc('upgrade_user_level', {
  p_user_id: user.userId,
  p_upgrade_key: upgradeKey,
  p_cost_coins: cost
});
```

#### 方案 B: 乐观锁 + 重试机制
```typescript
async function upgradeWithRetry(
  supabase: SupabaseClient,
  user: User,
  upgradeKey: string,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 获取带版本号的数据
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins, version')
        .eq('user_id', user.userId)
        .single();
      
      const cost = calculateUpgradeCost(upgradeKey, currentLevel);
      
      if (profile.coins < cost) {
        throw new Error('Insufficient coins');
      }
      
      // 使用版本号进行更新（乐观锁）
      const { error } = await supabase
        .from('profiles')
        .update({ 
          coins: profile.coins - cost,
          version: profile.version + 1
        })
        .eq('user_id', user.userId)
        .eq('version', profile.version); // 确保版本号未变
      
      if (!error) {
        // 更新成功，继续升级
        await supabase.from('upgrades')...
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // 重试前等待
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
}
```

---

## 🟡 中优先级问题

### 4. **未实现的功能 (TODO)** 📝

#### A. 喂食功能 (POST /api/game/feed)
**状态**: ❌ 未实现

**建议**: 根据前端逻辑，`feed` 实际上是一个升级类型，不需要独立接口。可以删除此端点或改造为"使用饲料"功能。

```typescript
// 如果要实现使用饲料加速
game.post('/feed', async (c) => {
  const user = c.get('user');
  
  // 检查是否有饲料库存
  // 消耗饲料，临时提升 idleRate
  // 记录加速结束时间
  
  return c.json({
    success: true,
    data: {
      boostEndsAt: Date.now() + 3600000, // 1小时后
      multiplier: 2
    }
  });
});
```

#### B. 市场交易功能
**状态**: ❌ 未实现
- POST /api/market/create-order
- POST /api/market/buy-order
- POST /api/market/cancel-order

**优先级**: 高（核心功能）

---

### 5. **错误处理不够细致** ❌

**问题描述**:
所有数据库错误都统一返回 `DATABASE_ERROR`，不利于调试和用户体验。

**当前代码**:
```typescript
} catch (error) {
  console.error('[Game Click Error]', error);
  throw Errors.DATABASE_ERROR; // 太笼统
}
```

**优化方案**:
```typescript
} catch (error) {
  console.error('[Game Click Error]', error);
  
  // 根据错误类型返回不同错误
  if (error instanceof PostgrestError) {
    if (error.code === '23505') {
      throw Errors.DUPLICATE_ENTRY;
    } else if (error.code === '23503') {
      throw Errors.FOREIGN_KEY_VIOLATION;
    }
  }
  
  // 已知业务错误直接抛出
  if (error instanceof Error && 'statusCode' in error) {
    throw error;
  }
  
  throw Errors.DATABASE_ERROR;
}
```

---

### 6. **输入验证可以改进** ✅

**问题描述**:
部分输入验证过于简单，可以使用验证库增强安全性。

**当前代码**:
```typescript
if (!rarity || !quantity || quantity <= 0) {
  throw Errors.INVALID_INPUT;
}
```

**优化方案**:
```typescript
import { z } from 'zod';

const SellRequestSchema = z.object({
  rarity: z.enum(['white', 'brown', 'silver', 'gold', 'purple', 'black']),
  quantity: z.number().int().positive().max(10000)
});

try {
  const { rarity, quantity } = SellRequestSchema.parse(await c.req.json());
  // 继续处理...
} catch (error) {
  if (error instanceof z.ZodError) {
    return c.json({
      success: false,
      error: 'Invalid input',
      details: error.errors
    }, 400);
  }
}
```

---

## 🟢 低优先级问题

### 7. **代码复用机会** ♻️

**问题**: 多处重复代码逻辑

#### 重复 A: 获取今日日期
```typescript
// ❌ 重复多次
const todayDate = new Date().toISOString().split('T')[0];
```

**优化**:
```typescript
// helpers.ts
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
```

#### 重复 B: 更新每日任务
```typescript
// 在多个接口中重复
const { data: task } = await supabase.from('daily_tasks')...
if (task) {
  await supabase.from('daily_tasks').update()...
} else {
  await supabase.from('daily_tasks').insert()...
}
```

**优化**:
```typescript
// gameLogic.ts
export async function updateDailyTask(
  supabase: SupabaseClient,
  userId: string,
  taskKey: string,
  progressDelta: number
) {
  const todayDate = getTodayDate();
  
  const { data: task } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('task_key', taskKey)
    .eq('date', todayDate)
    .single();
  
  if (task) {
    const maxProgress = GAME_CONFIG.DAILY_TASKS[taskKey].target;
    await supabase
      .from('daily_tasks')
      .update({ progress: Math.min(task.progress + progressDelta, maxProgress) })
      .eq('user_id', userId)
      .eq('task_key', taskKey)
      .eq('date', todayDate);
  } else {
    await supabase
      .from('daily_tasks')
      .insert({
        user_id: userId,
        task_key: taskKey,
        date: todayDate,
        progress: progressDelta,
        claimed: false
      });
  }
}
```

---

### 8. **缓存优化** 💾

**建议**: 对频繁查询的数据添加缓存

```typescript
// 缓存游戏配置
const configCache = new Map<string, any>();

export async function getCachedUpgradeConfig(upgradeKey: string) {
  const cacheKey = `upgrade:${upgradeKey}`;
  
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey);
  }
  
  const config = GAME_CONFIG.UPGRADES[upgradeKey];
  configCache.set(cacheKey, config);
  
  return config;
}
```

---

### 9. **日志和监控** 📊

**建议**: 添加结构化日志

```typescript
import { Logger } from './utils/logger';

const logger = new Logger('GameRoutes');

game.post('/click', async (c) => {
  const startTime = Date.now();
  const user = c.get('user');
  
  try {
    logger.info('Click started', { userId: user.userId });
    
    // ... 业务逻辑
    
    const duration = Date.now() - startTime;
    logger.info('Click completed', { 
      userId: user.userId, 
      duration,
      droppedEgg 
    });
    
    return c.json({ success: true, data: { ... } });
  } catch (error) {
    logger.error('Click failed', { 
      userId: user.userId, 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});
```

---

## 📋 优化优先级总结

| 优先级 | 问题 | 影响 | 工作量 | 状态 |
|-------|-----|------|---------|-------|
| 🟥 高 | 密码哈希安全性 | 安全 | 中 | ✅ 已完成 |
| 🟥 高 | 数据库事务支持 | 数据一致性 | 高 | ✅ 已完成 |
| 🟥 高 | 多次数据库查询 | 性能 | 中 | ✅ 已完成 |
| 🟪 中 | 未实现功能 (Market) | 功能完整性 | 高 | ⏳ 待实现 |
| 🟪 中 | 错误处理细化 | 用户体验 | 低 | ⏳ 待优化 |
| 🟪 中 | 输入验证增强 | 安全性 | 中 | ⏳ 待优化 |
| 🟢 低 | 代码复用 | 可维护性 | 低 | ⏳ 待优化 |
| 🟢 低 | 缓存优化 | 性能 | 中 | ⏳ 待优化 |
| 🟢 低 | 日志和监控 | 可观测性 | 中 | ⏳ 待优化 |

---

## 🎯 建议实施顺序

### 第一阶段（立即处理）✅ 已完成
1. ✅ 修复密码哈希安全问题 **已完成（2025-10-09）**
2. ✅ 添加数据库事务支持（RPC 函数）**已完成（2025-10-09）**
3. ✅ 优化并行查询 **已完成（2025-10-09）**

### 第二阶段（本周完成）
4. ⏳ 实现市场交易功能
5. ⏳ 细化错误处理
6. ⏳ 添加输入验证（Zod）

### 第三阶段（优化迭代）
7. ⏳ 代码复用重构
8. ⏳ 添加缓存层
9. ⏳ 完善日志监控

---

## 💡 额外建议

1. **单元测试**: 为游戏逻辑工具函数添加测试
2. **API 文档**: 使用 Swagger/OpenAPI 生成文档
3. **性能监控**: 集成 APM 工具（如 Sentry）
4. **速率限制**: 为 API 添加速率限制防止滥用
5. **数据备份**: 定期备份 Supabase 数据

---

## 📞 后续支持

如需帮助实施任何优化方案，请随时联系！
