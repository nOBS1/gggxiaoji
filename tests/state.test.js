/**
 * 测试 state.js 中的数据验证逻辑
 * 验证 dailyTasks 和 upgrades 字段的类型安全和边界限制
 */

import { safeLoadImportedData } from '../src/js/state.js';
import { CONFIG } from '../src/js/config.js';

/**
 * 测试辅助函数：验证字段值
 * @param {object} result - safeLoadImportedData 的返回结果
 * @param {string} category - 字段类别（'dailyTasks' 或 'upgrades'）
 * @param {string} field - 字段名
 * @param {*} expectedValue - 期望值
 */
function expectFieldValue(result, category, field, expectedValue) {
  expect(result).not.toBeNull();
  expect(result[category][field]).toBe(expectedValue);
}

/**
 * 测试辅助函数：创建测试数据
 * @param {string} category - 字段类别
 * @param {object} overrides - 要覆盖的字段
 */
function createTestData(category, overrides = {}) {
  const defaults = {
    dailyTasks: {
      clicks: 50,
      sellSilver: 10,
      clickTaskClaimed: true,
      sellTaskClaimed: false
    },
    upgrades: {
      level: 5,
      feed: 1,
      clickPower: 3,
      idleRate: 10,
      luckyChance: 5,
      autoSell: 2,
      goldBonus: 8
    }
  };
  
  return {
    [category]: { ...defaults[category], ...overrides }
  };
}

describe('safeLoadImportedData - dailyTasks 字段验证', () => {
  
  test('应该正确加载有效的 dailyTasks 数据', () => {
    const validData = createTestData('dailyTasks');
    const result = safeLoadImportedData(validData);
    
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(50);
    expect(result.dailyTasks.sellSilver).toBe(10);
    expect(result.dailyTasks.clickTaskClaimed).toBe(true);
    expect(result.dailyTasks.sellTaskClaimed).toBe(false);
  });

  // 参数化测试：类型错误应该回落到默认值
  test.each([
    ['clicks', "100", 0, '字符串'],
    ['sellSilver', true, 0, '布尔'],
    ['clickTaskClaimed', 1, false, '数字'],
    ['sellTaskClaimed', "false", false, '字符串']
  ])('应该拒绝 %s 为%s类型，使用默认值', (field, invalidValue, expectedDefault) => {
    const invalidData = createTestData('dailyTasks', { [field]: invalidValue });
    const result = safeLoadImportedData(invalidData);
    expectFieldValue(result, 'dailyTasks', field, expectedDefault);
  });

  test('应该处理多个字段类型错误，全部回落到默认值', () => {
    const invalidData = createTestData('dailyTasks', {
      clicks: "invalid",
      sellSilver: null,
      clickTaskClaimed: "true",
      sellTaskClaimed: 0
    });
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(0);
    expect(result.dailyTasks.sellSilver).toBe(0);
    expect(result.dailyTasks.clickTaskClaimed).toBe(false);
    expect(result.dailyTasks.sellTaskClaimed).toBe(false);
  });

  test('应该处理 dailyTasks 字段缺失，使用默认值', () => {
    const dataWithoutDailyTasks = {
      coins: 100
    };
    
    const result = safeLoadImportedData(dataWithoutDailyTasks);
    expect(result).not.toBeNull();
    expect(result.dailyTasks).toBeDefined();
    expect(result.dailyTasks.clicks).toBe(0);
    expect(result.dailyTasks.sellSilver).toBe(0);
    expect(result.dailyTasks.clickTaskClaimed).toBe(false);
    expect(result.dailyTasks.sellTaskClaimed).toBe(false);
  });

  test('应该处理 dailyTasks 为 null，使用默认值', () => {
    const invalidData = {
      dailyTasks: null
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(0);
    expect(result.dailyTasks.clickTaskClaimed).toBe(false);
  });

  // 参数化测试：数值边界处理
  test.each([
    ['负数应钳位到 0', { clicks: -50, sellSilver: -10 }, { clicks: 0, sellSilver: 0 }],
    ['小数应向下取整', { clicks: 99.9, sellSilver: 15.7 }, { clicks: 99, sellSilver: 15 }]
  ])('应该处理数值边界：%s', (description, input, expected) => {
    const invalidData = createTestData('dailyTasks', {
      ...input,
      clickTaskClaimed: false,
      sellTaskClaimed: false
    });
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(expected.clicks);
    expect(result.dailyTasks.sellSilver).toBe(expected.sellSilver);
  });
});

describe('safeLoadImportedData - upgrades 字段验证', () => {
  
  test('应该正确加载有效的 upgrades 数据', () => {
    const validData = createTestData('upgrades');
    
    const result = safeLoadImportedData(validData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(5);
    expect(result.upgrades.feed).toBe(1);
    expect(result.upgrades.clickPower).toBe(3);
    expect(result.upgrades.idleRate).toBe(10);
  });

  // 参数化测试：超过最大值应钳位
  test.each([
    ['level', 999, CONFIG.UPGRADES.level.maxLevel, 'maxLevel'],
    ['feed', 100, CONFIG.UPGRADES.feed.maxLevel, 'maxLevel'],
    ['clickPower', 9999, CONFIG.UPGRADES.clickPower.maxLevel, 'maxLevel'],
    ['idleRate', 9999, CONFIG.UPGRADES.idleRate.maxLevel, 'maxLevel'],
    ['luckyChance', 9999, CONFIG.UPGRADES.luckyChance.maxLevel, 'maxLevel'],
    ['autoSell', 9999, CONFIG.UPGRADES.autoSell.maxLevel, 'maxLevel'],
    ['goldBonus', 9999, CONFIG.UPGRADES.goldBonus.maxLevel, 'maxLevel']
  ])('应该将超过 %s 的 %s 钳位到 %s', (field, excessValue, expectedMax) => {
    const invalidData = createTestData('upgrades', { [field]: excessValue });
    const result = safeLoadImportedData(invalidData);
    expectFieldValue(result, 'upgrades', field, expectedMax);
  });

  test('应该将低于 minLevel 的 level 钳位到 1', () => {
    const invalidData = createTestData('upgrades', { level: 0 });
    const result = safeLoadImportedData(invalidData);
    expectFieldValue(result, 'upgrades', 'level', 1);
  });

  // 参数化测试：负数应钳位到 0
  test.each([
    ['feed', -5, 0],
    ['clickPower', -10, 0],
    ['idleRate', -20, 0]
  ])('应该将负数的 %s 钳位到 0', (field, negativeValue, expectedMin) => {
    const invalidData = createTestData('upgrades', { [field]: negativeValue });
    const result = safeLoadImportedData(invalidData);
    expectFieldValue(result, 'upgrades', field, expectedMin);
  });

  // 参数化测试：字符串类型应回落到默认值
  test.each([
    ['level', "10", 1],
    ['feed', "max", 0]
  ])('应该拒绝字符串类型的 %s，回落到最小值', (field, stringValue, expectedMin) => {
    const invalidData = createTestData('upgrades', { [field]: stringValue });
    const result = safeLoadImportedData(invalidData);
    expectFieldValue(result, 'upgrades', field, expectedMin);
  });

  test('应该处理 upgrades 字段缺失，使用默认值', () => {
    const dataWithoutUpgrades = {
      coins: 500
    };
    
    const result = safeLoadImportedData(dataWithoutUpgrades);
    expect(result).not.toBeNull();
    expect(result.upgrades).toBeDefined();
    expect(result.upgrades.level).toBe(1);
    expect(result.upgrades.feed).toBe(0);
    expect(result.upgrades.clickPower).toBe(0);
  });

  // 参数化测试：小数应向下取整
  test.each([
    ['level', 10.9, 10],
    ['feed', 1.5, 1],
    ['clickPower', 7.2, 7],
    ['idleRate', 15.8, 15],
    ['luckyChance', 8.3, 8],
    ['autoSell', 5.7, 5],
    ['goldBonus', 12.1, 12]
  ])('应该将小数 %s 向下取整', (field, floatValue, expected) => {
    const invalidData = createTestData('upgrades', { [field]: floatValue });
    const result = safeLoadImportedData(invalidData);
    expectFieldValue(result, 'upgrades', field, expected);
  });

  test('应该处理混合无效数据：类型错误+超出边界', () => {
    const invalidData = {
      upgrades: {
        level: "999",     // 类型错误
        feed: 9999,       // 超出上界
        clickPower: -50,  // 超出下界
        idleRate: 15,     // 有效
        luckyChance: null, // 类型错误
        autoSell: 5,      // 有效
        goldBonus: 100    // 超出上界
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(1);  // 类型错误 -> 默认值
    expect(result.upgrades.feed).toBe(2);   // 超出上界 -> 钳位到 maxLevel
    expect(result.upgrades.clickPower).toBe(0);  // 负数 -> 钳位到 0
    expect(result.upgrades.idleRate).toBe(15);   // 有效值
    expect(result.upgrades.luckyChance).toBe(0); // null -> 默认值
    expect(result.upgrades.autoSell).toBe(5);    // 有效值
    expect(result.upgrades.goldBonus).toBe(20);  // 超出上界 -> 钳位到 maxLevel
  });
});

describe('safeLoadImportedData - 原型污染防护', () => {
  
  // 参数化测试：危险属性应被拒绝
  test.each([
    ['__proto__', { isAdmin: true }],
    ['constructor', { prototype: { isAdmin: true } }],
    ['prototype', { isAdmin: true }]
  ])('应该拒绝包含 %s 的数据', (dangerousKey, dangerousValue) => {
    const maliciousData = {
      coins: 100,
      [dangerousKey]: dangerousValue
    };
    
    const result = safeLoadImportedData(maliciousData);
    expect(result).toBeNull();
  });
});

describe('safeLoadImportedData - 完整场景测试', () => {
  
  test('应该正确处理来自旧版本的存档数据（缺少新字段）', () => {
    const oldSaveData = {
      eggs: { white: 100, brown: 50, silver: 10, gold: 2, purple: 0, black: 0 },
      coins: 500,
      upgrades: {
        level: 8,
        feed: 1,
        clickPower: 5
        // 缺少 idleRate, luckyChance, autoSell, goldBonus
      },
      // 缺少 dailyTasks
      totalClicks: 1000
    };
    
    const result = safeLoadImportedData(oldSaveData);
    expect(result).not.toBeNull();
    expect(result.eggs.white).toBe(100);
    expect(result.coins).toBe(500);
    expect(result.upgrades.level).toBe(8);
    expect(result.upgrades.idleRate).toBe(0); // 缺失字段应该用默认值
    expect(result.upgrades.luckyChance).toBe(0);
    expect(result.dailyTasks.clicks).toBe(0);
    expect(result.dailyTasks.clickTaskClaimed).toBe(false);
  });

  test('应该正确处理被篡改的存档数据（所有字段都异常）', () => {
    const corruptedData = {
      eggs: { white: "999999", brown: -500, silver: 10.5 },
      coins: "infinite",
      upgrades: {
        level: 9999,
        feed: "max",
        clickPower: -100,
        idleRate: 9999,
        luckyChance: null,
        autoSell: undefined,
        goldBonus: 9999
      },
      dailyTasks: {
        clicks: "1000",
        sellSilver: true,
        clickTaskClaimed: 1,
        sellTaskClaimed: "false"
      }
    };
    
    const result = safeLoadImportedData(corruptedData);
    expect(result).not.toBeNull();
    
    // eggs: 应该回落到默认值或处理异常
    expect(result.eggs.white).toBe(0);  // 字符串 -> 默认值
    expect(result.eggs.brown).toBe(0);  // 负数 -> 0
    expect(result.eggs.silver).toBe(10); // 小数 -> 向下取整
    
    // coins: 字符串 -> 默认值
    expect(result.coins).toBe(0);
    
    // upgrades: 各种异常情况
    expect(result.upgrades.level).toBe(20);  // 9999 -> 钳位到 maxLevel
    expect(result.upgrades.feed).toBe(0);    // 字符串 -> 默认值
    expect(result.upgrades.clickPower).toBe(0); // 负数 -> 0
    expect(result.upgrades.idleRate).toBe(20);  // 9999 -> 钳位到 maxLevel
    expect(result.upgrades.luckyChance).toBe(0); // null -> 默认值
    expect(result.upgrades.autoSell).toBe(0);    // undefined -> 默认值
    expect(result.upgrades.goldBonus).toBe(20);  // 9999 -> 钳位到 maxLevel
    
    // dailyTasks: 类型错误
    expect(result.dailyTasks.clicks).toBe(0);    // 字符串 -> 默认值
    expect(result.dailyTasks.sellSilver).toBe(0); // 布尔 -> 默认值
    expect(result.dailyTasks.clickTaskClaimed).toBe(false); // 数字 -> 默认值
    expect(result.dailyTasks.sellTaskClaimed).toBe(false);  // 字符串 -> 默认值
  });
});
