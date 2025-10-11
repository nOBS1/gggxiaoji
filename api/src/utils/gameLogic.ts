// ==================== 游戏逻辑工具函数 ====================
// 包含游戏核心计算逻辑

// 游戏配置常量
export const GAME_CONFIG = {
  MAX_SAFE_NUMBER: 1e15,
  
  // 稀有度定义
  RARITIES: {
    white: { price: 1, baseWeight: 8200 },
    brown: { price: 2, baseWeight: 1200 },
    silver: { price: 5, baseWeight: 430 },
    gold: { price: 15, baseWeight: 130 },
    purple: { price: 40, baseWeight: 35 },
    black: { price: 200, baseWeight: 5 }
  },

  // 升级配置
  UPGRADES: {
    level: {
      baseCost: { white: 50, brown: 10 },
      maxLevel: 20
    },
    feed: {
      baseCost: { brown: 50, silver: 10 },
      maxLevel: 2
    },
    clickPower: {
      baseCost: { white: 30 },
      maxLevel: 10,
      baseValue: 20
    },
    idleRate: {
      baseCost: { white: 80, brown: 20 },
      maxLevel: 20,
      baseValue: 0.2
    },
    luckyChance: {
      costType: 'coins',
      baseCost: 50,
      maxLevel: 15,
      baseValue: 5
    },
    autoSell: {
      costType: 'coins',
      baseCost: 100,
      maxLevel: 10,
      baseValue: 0
    },
    goldBonus: {
      costType: 'coins',
      baseCost: 80,
      maxLevel: 20,
      baseValue: 10
    }
  },

  // 每日任务配置
  DAILY_TASKS: {
    daily_click: {
      target: 100,
      reward: 50  // 金币奖励
    },
    daily_sell: {
      target: 3,
      reward: 100  // 金币奖励
    }
  },

  // 市场交易配置
  MARKET: {
    FEE_RATE: 0.05,  // 5% 交易手续费
    MIN_PRICE: 1,    // 最低价格（金币）
    MAX_PRICE: 1000000,  // 最高价格（金币）
    MIN_QUANTITY: 1, // 最小数量
    MAX_QUANTITY: 999999, // 最大数量
    MAX_ORDERS_PER_USER: 10,  // 每个用户最多同时挂单数
    TRADABLE_RARITIES: ['purple', 'gold', 'black']  // 可交易的蛋类型
  }
} as const;

// 类型定义
type Rarity = keyof typeof GAME_CONFIG.RARITIES;
type UpgradeKey = keyof typeof GAME_CONFIG.UPGRADES;

// ==================== 工具函数 ====================

// 安全数值增加（防止溢出）
export function safeAdd(current: number, amount: number): number {
  const result = current + amount;
  return Math.min(result, GAME_CONFIG.MAX_SAFE_NUMBER);
}

// ==================== 游戏数值计算 ====================

// 获取点击力量
export function getClickPower(clickPowerLevel: number): number {
  return GAME_CONFIG.UPGRADES.clickPower.baseValue + clickPowerLevel * 5;
}

// 计算掉落权重
export function calculateWeights(
  level: number,
  feedTier: number,
  luckyChance: number
): Record<Rarity, number> {
  const weights: Record<string, number> = {};

  // 基础权重
  for (const [rarity, data] of Object.entries(GAME_CONFIG.RARITIES)) {
    weights[rarity] = data.baseWeight;
  }

  // 等级影响：从白蛋权重转移到其他蛋
  if (level > 1) {
    const shift = Math.min(1200, 60 * (level - 1));
    weights.white -= shift;
    weights.brown += shift * 0.35;
    weights.silver += shift * 0.30;
    weights.gold += shift * 0.20;
    weights.purple += shift * 0.10;
    weights.black += shift * 0.05;
  }

  // 饲料影响：提升高级蛋权重
  if (feedTier > 0) {
    const multiplier = feedTier === 1 ? 1.12 : 1.30;
    weights.silver *= multiplier;
    weights.gold *= multiplier;
    weights.purple *= multiplier;
    weights.black *= multiplier;
  }

  // 幸运加成：提升稀有蛋权重
  if (luckyChance > 0) {
    const bonus = 1 + (luckyChance * 0.05);  // 每级+5%
    weights.brown *= bonus;
    weights.silver *= bonus;
    weights.gold *= bonus;
    weights.purple *= bonus;
    weights.black *= bonus;
  }

  // 归一化为10000
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalizedWeights: Record<string, number> = {};
  for (const rarity in weights) {
    normalizedWeights[rarity] = Math.round(weights[rarity] / total * 10000);
  }

  return normalizedWeights as Record<Rarity, number>;
}

// 掉落蛋（基于权重和保底机制）
export function rollEgg(
  level: number,
  feedTier: number,
  luckyChance: number,
  blackPityCounter: number
): { rarity: Rarity; newPityCounter: number } {
  // 保底机制
  if (blackPityCounter >= 1000) {
    return { rarity: 'black', newPityCounter: 0 };
  }

  const weights = calculateWeights(level, feedTier, luckyChance);
  const roll = Math.floor(Math.random() * 10000);

  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) {
      if (rarity === 'black') {
        return { rarity: rarity as Rarity, newPityCounter: 0 };
      } else {
        return { rarity: rarity as Rarity, newPityCounter: blackPityCounter + 1 };
      }
    }
  }

  return { rarity: 'white', newPityCounter: blackPityCounter + 1 };
}

// ==================== 商店系统 ====================

// 计算卖出金币（含金币加成）
export function calculateSellValue(
  rarity: Rarity,
  quantity: number,
  goldBonusLevel: number
): number {
  const baseCoins = GAME_CONFIG.RARITIES[rarity].price * quantity;
  const bonusMultiplier = 1 + (goldBonusLevel * 0.1);  // 每级+10%
  return Math.floor(baseCoins * bonusMultiplier);
}

// ==================== 升级系统 ====================

// 计算升级成本
export function calculateUpgradeCost(
  upgradeKey: UpgradeKey,
  currentLevel: number
): number | Record<Rarity, number> {
  const config = GAME_CONFIG.UPGRADES[upgradeKey];

  // 如果是金币升级
  if ('costType' in config && config.costType === 'coins') {
    return Math.floor(config.baseCost * Math.pow(1.8, currentLevel));
  }

  // 普通蛋升级
  const costs: Record<string, number> = {};
  for (const [rarity, base] of Object.entries(config.baseCost)) {
    costs[rarity] = Math.floor(base * Math.pow(1.5, currentLevel));
  }

  return costs as Record<Rarity, number>;
}

// 检查是否可以升级
export function canAffordUpgrade(
  upgradeKey: UpgradeKey,
  currentLevel: number,
  coins: number,
  inventory: Record<Rarity, number>
): boolean {
  const config = GAME_CONFIG.UPGRADES[upgradeKey];

  if (currentLevel >= config.maxLevel) return false;

  const cost = calculateUpgradeCost(upgradeKey, currentLevel);

  // 如果是金币升级
  if (typeof cost === 'number') {
    return coins >= cost;
  }

  // 普通蛋升级
  for (const [rarity, amount] of Object.entries(cost)) {
    if (inventory[rarity as Rarity] < amount) return false;
  }

  return true;
}

// ==================== 任务系统 ====================

// 检查任务是否完成
export function isTaskCompleted(taskKey: string, progress: number): boolean {
  const task = GAME_CONFIG.DAILY_TASKS[taskKey as keyof typeof GAME_CONFIG.DAILY_TASKS];
  if (!task) return false;
  return progress >= task.target;
}

// 获取任务奖励
export function getTaskReward(taskKey: string): number {
  const task = GAME_CONFIG.DAILY_TASKS[taskKey as keyof typeof GAME_CONFIG.DAILY_TASKS];
  return task?.reward || 0;
}

// ==================== 市场交易系统 ====================

// 计算交易手续费
export function calculateMarketFee(totalPrice: number): number {
  return Math.floor(totalPrice * GAME_CONFIG.MARKET.FEE_RATE);
}

// 计算卖家收入（扣除手续费后）
export function calculateSellerReceive(totalPrice: number): number {
  const fee = calculateMarketFee(totalPrice);
  return totalPrice - fee;
}

// 验证订单价格是否有效
export function isValidPrice(price: number): boolean {
  return (
    Number.isInteger(price) &&
    price >= GAME_CONFIG.MARKET.MIN_PRICE &&
    price <= GAME_CONFIG.MARKET.MAX_PRICE
  );
}

// 验证订单数量是否有效
export function isValidQuantity(quantity: number): boolean {
  return (
    Number.isInteger(quantity) &&
    quantity >= GAME_CONFIG.MARKET.MIN_QUANTITY &&
    quantity <= GAME_CONFIG.MARKET.MAX_QUANTITY
  );
}

// 计算单价（用于显示）
export function calculateUnitPrice(totalPrice: number, quantity: number): number {
  return Math.floor(totalPrice / quantity);
}

// 验证市场订单参数
export function validateMarketOrder(
  rarity: string,
  quantity: number,
  price: number
): { valid: boolean; error?: string } {
  // 验证稀有度
  if (!Object.keys(GAME_CONFIG.RARITIES).includes(rarity)) {
    return { valid: false, error: 'INVALID_RARITY' };
  }
  
  // 验证是否是可交易的蛋类型（只允许紫蛋、金蛋、黑蛋）
  if (!GAME_CONFIG.MARKET.TRADABLE_RARITIES.includes(rarity)) {
    return { valid: false, error: 'NOT_TRADABLE' };
  }

  // 验证数量
  if (!isValidQuantity(quantity)) {
    return { valid: false, error: 'INVALID_QUANTITY' };
  }

  // 验证价格
  if (!isValidPrice(price)) {
    return { valid: false, error: 'INVALID_PRICE' };
  }

  return { valid: true };
}
