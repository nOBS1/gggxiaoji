/**
 * 测试 state.js 中的数据验证逻辑
 * 验证 dailyTasks 和 upgrades 字段的类型安全和边界限制
 */

import { safeLoadImportedData } from '../src/js/state.js';
import { CONFIG } from '../src/js/config.js';

describe('safeLoadImportedData - dailyTasks 字段验证', () => {
  
  test('应该正确加载有效的 dailyTasks 数据', () => {
    const validData = {
      dailyTasks: {
        clicks: 50,
        sellSilver: 10,
        clickTaskClaimed: true,
        sellTaskClaimed: false
      }
    };
    
    const result = safeLoadImportedData(validData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(50);
    expect(result.dailyTasks.sellSilver).toBe(10);
    expect(result.dailyTasks.clickTaskClaimed).toBe(true);
    expect(result.dailyTasks.sellTaskClaimed).toBe(false);
  });

  test('应该拒绝 clicks 为字符串类型，使用默认值 0', () => {
    const invalidData = {
      dailyTasks: {
        clicks: "100",  // 错误类型：字符串而非数字
        sellSilver: 5,
        clickTaskClaimed: false,
        sellTaskClaimed: false
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(0); // 应该回落到默认值
    expect(result.dailyTasks.sellSilver).toBe(5); // 其他字段正常
  });

  test('应该拒绝 clickTaskClaimed 为数字类型，使用默认值 false', () => {
    const invalidData = {
      dailyTasks: {
        clicks: 30,
        sellSilver: 2,
        clickTaskClaimed: 1,  // 错误类型：数字而非布尔
        sellTaskClaimed: false
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clickTaskClaimed).toBe(false); // 应该回落到默认值
    expect(result.dailyTasks.clicks).toBe(30); // 其他字段正常
  });

  test('应该拒绝 sellSilver 为布尔类型，使用默认值 0', () => {
    const invalidData = {
      dailyTasks: {
        clicks: 20,
        sellSilver: true,  // 错误类型：布尔而非数字
        clickTaskClaimed: false,
        sellTaskClaimed: true
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.sellSilver).toBe(0); // 应该回落到默认值
    expect(result.dailyTasks.sellTaskClaimed).toBe(true); // 其他字段正常
  });

  test('应该处理多个字段类型错误，全部回落到默认值', () => {
    const invalidData = {
      dailyTasks: {
        clicks: "invalid",
        sellSilver: null,
        clickTaskClaimed: "true",
        sellTaskClaimed: 0
      }
    };
    
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

  test('应该将负数的 clicks 和 sellSilver 钳位到 0', () => {
    const invalidData = {
      dailyTasks: {
        clicks: -50,
        sellSilver: -10,
        clickTaskClaimed: false,
        sellTaskClaimed: false
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(0);
    expect(result.dailyTasks.sellSilver).toBe(0);
  });

  test('应该将小数的 clicks 和 sellSilver 向下取整', () => {
    const invalidData = {
      dailyTasks: {
        clicks: 99.9,
        sellSilver: 15.7,
        clickTaskClaimed: true,
        sellTaskClaimed: false
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.dailyTasks.clicks).toBe(99);
    expect(result.dailyTasks.sellSilver).toBe(15);
  });
});

describe('safeLoadImportedData - upgrades 字段验证', () => {
  
  test('应该正确加载有效的 upgrades 数据', () => {
    const validData = {
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
    
    const result = safeLoadImportedData(validData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(5);
    expect(result.upgrades.feed).toBe(1);
    expect(result.upgrades.clickPower).toBe(3);
    expect(result.upgrades.idleRate).toBe(10);
  });

  test('应该将超过 maxLevel 的 level 钳位到 maxLevel (20)', () => {
    const invalidData = {
      upgrades: {
        level: 999,  // 超过最大等级 20
        feed: 0,
        clickPower: 0,
        idleRate: 0,
        luckyChance: 0,
        autoSell: 0,
        goldBonus: 0
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(CONFIG.UPGRADES.level.maxLevel); // 应该钳位到 20
  });

  test('应该将低于 minLevel 的 level 钳位到 1', () => {
    const invalidData = {
      upgrades: {
        level: 0,  // 低于最小等级 1
        feed: 1,
        clickPower: 5,
        idleRate: 3,
        luckyChance: 2,
        autoSell: 1,
        goldBonus: 4
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(1); // 应该钳位到 1
  });

  test('应该将超过 maxLevel 的 feed 钳位到 maxLevel (2)', () => {
    const invalidData = {
      upgrades: {
        level: 10,
        feed: 100,  // 超过最大等级 2
        clickPower: 5,
        idleRate: 8,
        luckyChance: 3,
        autoSell: 4,
        goldBonus: 6
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.feed).toBe(CONFIG.UPGRADES.feed.maxLevel); // 应该钳位到 2
  });

  test('应该将负数的 feed/clickPower/idleRate 钳位到 0', () => {
    const invalidData = {
      upgrades: {
        level: 5,
        feed: -5,
        clickPower: -10,
        idleRate: -20,
        luckyChance: 5,
        autoSell: 3,
        goldBonus: 7
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.feed).toBe(0);
    expect(result.upgrades.clickPower).toBe(0);
    expect(result.upgrades.idleRate).toBe(0);
  });

  test('应该将超过各自 maxLevel 的所有升级字段钳位', () => {
    const invalidData = {
      upgrades: {
        level: 9999,
        feed: 9999,
        clickPower: 9999,
        idleRate: 9999,
        luckyChance: 9999,
        autoSell: 9999,
        goldBonus: 9999
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(CONFIG.UPGRADES.level.maxLevel);
    expect(result.upgrades.feed).toBe(CONFIG.UPGRADES.feed.maxLevel);
    expect(result.upgrades.clickPower).toBe(CONFIG.UPGRADES.clickPower.maxLevel);
    expect(result.upgrades.idleRate).toBe(CONFIG.UPGRADES.idleRate.maxLevel);
    expect(result.upgrades.luckyChance).toBe(CONFIG.UPGRADES.luckyChance.maxLevel);
    expect(result.upgrades.autoSell).toBe(CONFIG.UPGRADES.autoSell.maxLevel);
    expect(result.upgrades.goldBonus).toBe(CONFIG.UPGRADES.goldBonus.maxLevel);
  });

  test('应该拒绝字符串类型的升级字段，回落到最小值', () => {
    const invalidData = {
      upgrades: {
        level: "10",  // 字符串而非数字
        feed: "max",
        clickPower: 5,
        idleRate: 3,
        luckyChance: 2,
        autoSell: 1,
        goldBonus: 4
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(1);  // level 最小值是 1
    expect(result.upgrades.feed).toBe(0);   // 其他最小值是 0
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

  test('应该将小数升级等级向下取整', () => {
    const invalidData = {
      upgrades: {
        level: 10.9,
        feed: 1.5,
        clickPower: 7.2,
        idleRate: 15.8,
        luckyChance: 8.3,
        autoSell: 5.7,
        goldBonus: 12.1
      }
    };
    
    const result = safeLoadImportedData(invalidData);
    expect(result).not.toBeNull();
    expect(result.upgrades.level).toBe(10);
    expect(result.upgrades.feed).toBe(1);
    expect(result.upgrades.clickPower).toBe(7);
    expect(result.upgrades.idleRate).toBe(15);
    expect(result.upgrades.luckyChance).toBe(8);
    expect(result.upgrades.autoSell).toBe(5);
    expect(result.upgrades.goldBonus).toBe(12);
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
  
  test('应该拒绝包含 __proto__ 的数据', () => {
    const maliciousData = {
      coins: 100,
      "__proto__": { isAdmin: true }
    };
    
    const result = safeLoadImportedData(maliciousData);
    expect(result).toBeNull(); // 应该返回 null
  });

  test('应该拒绝包含 constructor 的数据', () => {
    const maliciousData = {
      coins: 100,
      "constructor": { prototype: { isAdmin: true } }
    };
    
    const result = safeLoadImportedData(maliciousData);
    expect(result).toBeNull();
  });

  test('应该拒绝包含 prototype 的数据', () => {
    const maliciousData = {
      coins: 100,
      "prototype": { isAdmin: true }
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
