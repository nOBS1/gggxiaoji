/**
 * 游戏配置文件
 * 包含所有游戏常量和配置项
 */

export const CONFIG = {
  STORAGE_KEY: 'xiaoji-game-v2',
  IDLE_INTERVAL_MS: 60000, // 60秒
  AD_COOLDOWN_SEC: 30,
  AD_DAILY_LIMIT: 50,
  DEFAULT_LANG: 'zh',
  MAX_SAFE_NUMBER: 1e15,  // 最大安全数值
  
  // API 配置
  // API_BASE_URL: 'http://localhost:8787/api', // 开发环境
  API_BASE_URL: 'https://xiaoji-game-api.weixinyongjiu.workers.dev/api', // 生产环境
  
  // OAuth 配置
  OAUTH: {
    GOOGLE: {
      ENABLED: true,
      AUTH_URL: '/auth/google',  // 相对于 API_BASE_URL
    }
  },
  
  // 市场交易配置
  MARKET: {
    FEE_RATE: 0.05,        // 5% 交易手续费
    MIN_PRICE: 1,          // 最低价格（金币）
    MAX_PRICE: 1000000,    // 最高价格（金币）
    MIN_QUANTITY: 1,       // 最小数量
    MAX_QUANTITY: 999999   // 最大数量
  },
  
  // 稀有度定义
  RARITIES: {
    white: { nameKey: 'rarityWhite', emoji: '🥚', image: '/eggs/White-egg-v2.png', price: 1, baseWeight: 8200 },
    brown: { nameKey: 'rarityBrown', emoji: '🥜', image: '/eggs/Brown-egg-v2.png', price: 2, baseWeight: 1200 },
    silver: { nameKey: 'raritySilver', emoji: '⚪', image: '/eggs/Silver-egg-v2.png', price: 5, baseWeight: 430 },
    gold: { nameKey: 'rarityGold', emoji: '🥇', image: '/eggs/Gold-egg-v2.png', price: 15, baseWeight: 130 },
    purple: { nameKey: 'rarityPurple', emoji: '🟣', image: '/eggs/Purple-egg-v2.png', price: 40, baseWeight: 35 },
    black: { nameKey: 'rarityBlack', emoji: '⚫', image: '/eggs/Black-egg-v2.png', price: 200, baseWeight: 5 }
  },

  // 升级配置
  UPGRADES: {
    level: {
      name: '小鸡等级',
      desc: '提升稀有蛋掉落概率',
      baseCost: { white: 50, brown: 10 },
      maxLevel: 20
    },
    feed: {
      name: '饲料品质',
      desc: '提升高级蛋掉落权重',
      baseCost: { brown: 50, silver: 10 },
      maxLevel: 2,
      tiers: ['普通', '高级', '顶级']
    },
    clickPower: {
      name: '强力啄',
      desc: '每次点击增加更多进度',
      baseCost: { white: 30 },
      maxLevel: 10,
      baseValue: 20
    },
    idleRate: {
      name: '被动效率',
      desc: '提升每分钟产蛋速度',
      baseCost: { white: 80, brown: 20 },
      maxLevel: 20,
      baseValue: 0.2  // 0.2个/分钟 = 1个/5分钟
    },
    // 金币升级选项
    luckyChance: {
      name: '幸运加成',
      desc: '提升所有稀有蛋掉落率',
      costType: 'coins',  // 使用金币
      baseCost: 50,
      maxLevel: 15,
      baseValue: 5  // 每级+5%
    },
    autoSell: {
      name: '自动售卖',
      desc: '自动出售白蛋换取金币',
      costType: 'coins',
      baseCost: 100,
      maxLevel: 10,
      baseValue: 0  // 每分钟自动卖出数量
    },
    goldBonus: {
      name: '金币加成',
      desc: '提升卖蛋获得的金币',
      costType: 'coins',
      baseCost: 80,
      maxLevel: 20,
      baseValue: 10  // 每级+10%
    }
  }
};
