/**
 * 合成奖励模块
 * 定义数字到鸡蛋的映射和奖励计算
 */

import { CONFIG } from '../config.js';
import { state, saveGame } from '../state.js';

// 数字到鸡蛋类型的映射
export const NUMBER_TO_EGG_MAP = {
  2: { eggType: 'white', count: 1 },
  4: { eggType: 'white', count: 1 },
  8: { eggType: 'brown', count: 1 },
  16: { eggType: 'brown', count: 2 },
  32: { eggType: 'silver', count: 1 },
  64: { eggType: 'silver', count: 2 },
  128: { eggType: 'gold', count: 1 },
  256: { eggType: 'gold', count: 2 },
  512: { eggType: 'purple', count: 1 },
  1024: { eggType: 'purple', count: 2 },
  2048: { eggType: 'black', count: 5 }
};

// 获取数字对应的鸡蛋类型
export function getEggTypeByNumber(num) {
  const mapping = NUMBER_TO_EGG_MAP[num];
  return mapping ? mapping.eggType : null;
}

// 获取数字对应的鸡蛋数量（考虑升级加成）
export function getEggCountByNumber(num) {
  const mapping = NUMBER_TO_EGG_MAP[num];
  if (!mapping) return 0;

  const baseCount = mapping.count;
  
  // 小鸡等级加成：每级+5%
  const levelMultiplier = 1 + (state.upgrades.level * 0.05);
  
  // 幸运加成：每级+3%（对稀有蛋额外加成）
  let luckyMultiplier = 1;
  if (['gold', 'purple', 'black'].includes(mapping.eggType)) {
    luckyMultiplier = 1 + (state.upgrades.luckyChance * 0.03);
  }
  
  const finalCount = Math.floor(baseCount * levelMultiplier * luckyMultiplier);
  return Math.max(1, finalCount); // 至少1个
}

// 处理合成奖励
export function processMergeReward(mergedValue) {
  const eggType = getEggTypeByNumber(mergedValue);
  if (!eggType) return null;

  const eggCount = getEggCountByNumber(mergedValue);
  
  // 产蛋到背包
  state.eggs[eggType] = Math.min(
    state.eggs[eggType] + eggCount,
    CONFIG.MAX_SAFE_NUMBER
  );
  
  // 记录本局产蛋统计
  if (!state.mergeGame.sessionEggs) {
    state.mergeGame.sessionEggs = {
      white: 0,
      brown: 0,
      silver: 0,
      gold: 0,
      purple: 0,
      black: 0
    };
  }
  state.mergeGame.sessionEggs[eggType] += eggCount;
  
  saveGame();
  
  return {
    eggType,
    eggCount,
    mergedValue,
    emoji: CONFIG.RARITIES[eggType].emoji
  };
}

// 获取数字对应的颜色
export function getTileColor(value) {
  const colorMap = {
    0: '#cdc1b4',      // 空格
    2: '#eee4da',      // 淡黄
    4: '#ede0c8',      // 黄
    8: '#f2b179',      // 橙
    16: '#f59563',     // 深橙
    32: '#f67c5f',     // 红橙
    64: '#f65e3b',     // 红
    128: '#edcf72',    // 金
    256: '#edcc61',    // 深金
    512: '#9c44dc',    // 紫
    1024: '#7c3aed',   // 深紫
    2048: '#3c3a32'    // 黑
  };
  
  return colorMap[value] || '#3c3a32';
}

// 获取数字对应的文字颜色
export function getTileTextColor(value) {
  return value <= 4 ? '#776e65' : '#f9f6f2';
}

// 获取数字对应的字体大小
export function getTileFontSize(value) {
  if (value >= 1024) return '35px';
  if (value >= 128) return '45px';
  return '55px';
}

// 获取本局统计
export function getSessionStats() {
  if (!state.mergeGame.sessionEggs) {
    return {
      white: 0,
      brown: 0,
      silver: 0,
      gold: 0,
      purple: 0,
      black: 0
    };
  }
  return { ...state.mergeGame.sessionEggs };
}

// 重置本局统计
export function resetSessionStats() {
  state.mergeGame.sessionEggs = {
    white: 0,
    brown: 0,
    silver: 0,
    gold: 0,
    purple: 0,
    black: 0
  };
}
