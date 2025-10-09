// ==================== 辅助工具函数 ====================

import { customAlphabet } from 'nanoid';

// 生成唯一ID（用于用户、订单等）
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

export const generateId = (): string => {
  return nanoid();
};

// 获取当前日期字符串（YYYY-MM-DD）
export const getTodayDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// 获取当前时间戳（毫秒）
export const getTimestamp = (): number => {
  return Date.now();
};

// 延迟函数（用于模拟异步操作或测试）
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 稀有度列表
export const RARITIES = ['white', 'brown', 'silver', 'gold', 'purple', 'black'] as const;
export type Rarity = typeof RARITIES[number];

// 升级类型列表
export const UPGRADE_KEYS = [
  'level',
  'feed',
  'clickPower',
  'idleRate',
  'luckyChance',
  'autoSell',
  'goldBonus',
] as const;
export type UpgradeKey = typeof UPGRADE_KEYS[number];

// 验证稀有度
export const isValidRarity = (rarity: string): rarity is Rarity => {
  return RARITIES.includes(rarity as Rarity);
};

// 验证升级类型
export const isValidUpgradeKey = (key: string): key is UpgradeKey => {
  return UPGRADE_KEYS.includes(key as UpgradeKey);
};
