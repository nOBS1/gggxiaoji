# 测试文档 | Test Documentation

## 概述

本目录包含小趣闻·啄米鸡游戏的测试套件。测试使用 Vitest 框架编写。

## 测试文件

### `state.test.js`

测试 `state.js` 中的数据验证和安全加载逻辑，主要验证：

#### 1. **dailyTasks 字段验证**
   - ✅ 类型安全检查（数字 vs 布尔 vs 字符串）
   - ✅ 类型不匹配时回落到默认值
   - ✅ 负数钳位到 0
   - ✅ 小数向下取整
   - ✅ 缺失字段使用默认值

#### 2. **upgrades 字段验证**
   - ✅ 根据 config.js 中的 maxLevel 进行边界钳位
   - ✅ level 字段最小值为 1，其他字段最小值为 0
   - ✅ 类型错误时回落到最小值
   - ✅ 超出上界钳位到 maxLevel
   - ✅ 超出下界钳位到 minLevel
   - ✅ 小数向下取整

#### 3. **原型污染防护**
   - ✅ 检测并拒绝 `__proto__` 字段
   - ✅ 检测并拒绝 `constructor` 字段  
   - ✅ 检测并拒绝 `prototype` 字段

#### 4. **完整场景测试**
   - ✅ 旧版本存档兼容性（缺少新字段）
   - ✅ 被篡改存档的修复（混合多种异常情况）

## 运行测试

### 安装依赖
```bash
npm install
```

### 运行所有测试
```bash
npm test
```

### 监听模式（开发时使用）
```bash
npm run test:watch
```

### 生成测试覆盖率报告
```bash
npm run test:coverage
```

## 测试覆盖的问题

本测试套件专门验证以下两个已修复的 bug：

### Bug 1: dailyTasks 类型验证不完整
**问题**: 如果 dailyTasks 字段类型错误（如 clicks 是字符串而非数字），之前会留下 undefined，导致后续代码出现 NaN。

**修复**: 在 `safeLoadData` 中添加严格的类型检查，类型不匹配时回落到默认值。

**测试**: 
- `应该拒绝 clicks 为字符串类型，使用默认值 0`
- `应该拒绝 clickTaskClaimed 为数字类型，使用默认值 false`
- `应该处理多个字段类型错误，全部回落到默认值`

### Bug 2: upgrades 字段缺少边界钳位
**问题**: 被篡改或损坏的存档可能包含超出范围的升级等级（如 level=9999），导致游戏逻辑错误。

**修复**: 根据 `CONFIG.UPGRADES[upgradeType].maxLevel` 动态钳位所有升级字段到有效范围。

**测试**:
- `应该将超过 maxLevel 的 level 钳位到 maxLevel (20)`
- `应该将低于 minLevel 的 level 钳位到 1`
- `应该将超过各自 maxLevel 的所有升级字段钳位`
- `应该处理混合无效数据：类型错误+超出边界`

## 注意事项

- 测试使用 ES6 模块语法，与源代码保持一致
- 测试环境配置为 jsdom 以模拟浏览器环境
- 所有测试都应该保持独立性，不依赖于其他测试的状态
- 测试数据应该覆盖边界条件和异常情况

## 未来扩展

建议添加的测试：
- [ ] `eggs.js` 中的产蛋逻辑测试
- [ ] `upgrades.js` 中的升级计算测试  
- [ ] `tasks.js` 中的任务进度和奖励测试
- [ ] `sound.js` 中的音频管理测试
- [ ] `i18n.js` 中的国际化切换测试
