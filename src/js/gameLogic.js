/**
 * 游戏核心逻辑模块
 * 包含：掉落系统、升级系统、经济系统等
 */

import { CONFIG } from './config.js';
import { state, saveGame, safeLoadImportedData } from './state.js';
import { showFloatText, showDropNotification } from './ui.js';

// ==================== 工具函数 ====================

// 安全数值增加（防止溢出）
function safeAdd(current, amount) {
  const result = current + amount;
  return Math.min(result, CONFIG.MAX_SAFE_NUMBER);
}

// ==================== 游戏数值计算 ====================

export function getIdleRate() {
  // 基础值 0.2，每级 +0.2
  return CONFIG.UPGRADES.idleRate.baseValue + (state.upgrades.idleRate * 0.2);
}

export function getClickPower() {
  return CONFIG.UPGRADES.clickPower.baseValue + state.upgrades.clickPower * 5;
}

export function calculateWeights() {
  const weights = {};
  const level = state.upgrades.level;
  const feedTier = state.upgrades.feed;
  const luckyChance = state.upgrades.luckyChance;  // 幸运加成

  // 基础权重
  for (let [rarity, data] of Object.entries(CONFIG.RARITIES)) {
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
  for (let rarity in weights) {
    weights[rarity] = Math.round(weights[rarity] / total * 10000);
  }

  return weights;
}

// ==================== 掉落系统 ====================

export function rollEgg() {
  // 保底机制
  if (state.blackPityCounter >= 1000) {
    state.blackPityCounter = 0;
    return 'black';
  }

  const weights = calculateWeights();
  const roll = Math.floor(Math.random() * 10000);
  
  let cumulative = 0;
  for (let [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) {
      if (rarity === 'black') {
        state.blackPityCounter = 0;
      } else {
        state.blackPityCounter++;
      }
      return rarity;
    }
  }

  return 'white';
}

export function dropEgg(showNotification = true, skipSave = false) {
  const rarity = rollEgg();
  state.eggs[rarity] = safeAdd(state.eggs[rarity], 1);
  
  if (showNotification && ['gold', 'purple', 'black'].includes(rarity)) {
    showDropNotification(rarity);
  }
  
  // 批量操作时跳过保存，由调用者统一保存
  if (!skipSave) {
    saveGame();
  }
  
  return rarity;
}

// ==================== 点击系统 ====================

export function handleClick(x, y) {
  const power = getClickPower();
  state.peckProgress += power;
  state.totalClicks++;
  state.dailyTasks.clicks++;
  
  if (state.peckProgress >= 100) {
    state.peckProgress -= 100;
    const rarity = dropEgg();
    showFloatText(x, y, `+1 ${CONFIG.RARITIES[rarity].emoji}`);
    playSound('click');
  } else {
    showFloatText(x, y, `+${power}%`);
  }
  
  saveGame();
}

// ==================== 商店系统 ====================

export function sellEgg(rarity, amount = 1, silent = false) {
  if (state.eggs[rarity] < amount) {
    // 静默模式下不显示错误信息
    if (!silent) {
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, '蛋不够了！');
    }
    return false;
  }
  
  state.eggs[rarity] -= amount;
  
  // 计算金币（包含金币加成）
  const baseCoins = CONFIG.RARITIES[rarity].price * amount;
  const goldBonus = state.upgrades.goldBonus;  // 金币加成
  const bonusMultiplier = 1 + (goldBonus * 0.1);  // 每级+10%
  const coins = Math.floor(baseCoins * bonusMultiplier);
  
  state.coins = safeAdd(state.coins, coins);
  state.totalEggsSold = safeAdd(state.totalEggsSold, amount);
  
  if (rarity === 'silver') {
    state.dailyTasks.sellSilver += amount;
  }
  
  // 静默模式下不显示效果和声音
  if (!silent) {
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, `+${coins} 💰`);
    playSound('sell');
    saveGame();
  }
  
  return true;
}

// ==================== 升级系统 ====================

export function calculateUpgradeCost(upgradeKey, currentLevel) {
  const config = CONFIG.UPGRADES[upgradeKey];
  
  // 如果是金币升级
  if (config.costType === 'coins') {
    return Math.floor(config.baseCost * Math.pow(1.8, currentLevel));
  }
  
  // 普通蛋升级
  const costs = {};
  for (let [rarity, base] of Object.entries(config.baseCost)) {
    costs[rarity] = Math.floor(base * Math.pow(1.5, currentLevel));
  }
  
  return costs;
}

export function canAffordUpgrade(upgradeKey) {
  const currentLevel = state.upgrades[upgradeKey];
  const config = CONFIG.UPGRADES[upgradeKey];
  
  if (currentLevel >= config.maxLevel) return false;
  
  const cost = calculateUpgradeCost(upgradeKey, currentLevel);
  
  // 如果是金币升级
  if (config.costType === 'coins') {
    return state.coins >= cost;
  }
  
  // 普通蛋升级
  for (let [rarity, amount] of Object.entries(cost)) {
    if (state.eggs[rarity] < amount) return false;
  }
  
  return true;
}

export function doUpgrade(upgradeKey) {
  const config = CONFIG.UPGRADES[upgradeKey];
  const currentLevel = state.upgrades[upgradeKey];
  
  if (currentLevel >= config.maxLevel) {
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, '已达最高等级！');
    return false;
  }
  
  const cost = calculateUpgradeCost(upgradeKey, currentLevel);
  
  // 如果是金币升级
  if (config.costType === 'coins') {
    if (state.coins < cost) {
      showFloatText(window.innerWidth / 2, window.innerHeight / 2, '金币不足！');
      return false;
    }
    state.coins -= cost;
  } else {
    // 普通蛋升级
    // 检查资源
    for (let [rarity, amount] of Object.entries(cost)) {
      if (state.eggs[rarity] < amount) {
        showFloatText(window.innerWidth / 2, window.innerHeight / 2, '资源不足！');
        return false;
      }
    }
    
    // 扣除资源
    for (let [rarity, amount] of Object.entries(cost)) {
      state.eggs[rarity] -= amount;
    }
  }
  
  state.upgrades[upgradeKey]++;
  
  playSound('upgrade');
  saveGame();
  return true;
}

// ==================== 任务系统 ====================

export function getTasks() {
  return [
    {
      id: 'daily_click',
      progress: Math.min(state.dailyTasks.clicks, 100),  // 限制显示上限
      target: 100,
      reward: { white: 10 },
      completed: state.dailyTasks.clicks >= 100 && !state.dailyTasks.clickTaskClaimed,
      claimed: state.dailyTasks.clickTaskClaimed
    },
    {
      id: 'daily_sell',
      progress: Math.min(state.dailyTasks.sellSilver, 3),  // 限制显示上限
      target: 3,
      reward: { white: 15 },
      completed: state.dailyTasks.sellSilver >= 3 && !state.dailyTasks.sellTaskClaimed,
      claimed: state.dailyTasks.sellTaskClaimed
    }
  ];
}

export function claimTask(taskId) {
  if (taskId === 'daily_click' && state.dailyTasks.clicks >= 100 && !state.dailyTasks.clickTaskClaimed) {
    state.eggs.white = safeAdd(state.eggs.white, 10);
    state.dailyTasks.clickTaskClaimed = true;
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, '+10 🥚 领取成功！');
    saveGame();
    return true;
  } else if (taskId === 'daily_sell' && state.dailyTasks.sellSilver >= 3 && !state.dailyTasks.sellTaskClaimed) {
    state.eggs.white = safeAdd(state.eggs.white, 15);
    state.dailyTasks.sellTaskClaimed = true;
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, '+15 🥚 领取成功！');
    saveGame();
    return true;
  }
  return false;
}

// ==================== 广告系统 ====================

export function canWatchAd() {
  return state.adCooldown === 0 && state.adWatchedToday < CONFIG.AD_DAILY_LIMIT;
}

export function watchAd(onComplete) {
  if (!canWatchAd()) return false;
  
  // 模拟广告播放（3秒）
  setTimeout(() => {
    state.eggs.white += 5;
    state.adWatchedToday++;
    state.adCooldown = CONFIG.AD_COOLDOWN_SEC;
    
    showFloatText(window.innerWidth / 2, window.innerHeight / 2, '+5 🥚');
    playSound('reward');
    
    saveGame();
    if (onComplete) onComplete();
  }, 3000);
  
  return true;
}

// ==================== 被动产蛋 ====================

export function processPassiveIncome() {
  const now = Date.now();
  const elapsed = now - state.lastIdleTick;
  
  if (elapsed >= CONFIG.IDLE_INTERVAL_MS) {
    const rate = getIdleRate();
    const minutes = elapsed / CONFIG.IDLE_INTERVAL_MS;
    
    // 计算应该产生的蛋（包括小数）
    const eggsToAddDecimal = minutes * rate;
    
    // 加入累积器
    state.idleEggAccumulator += eggsToAddDecimal;
    
    // 只掉落整数个蛋，小数部分保留
    const eggsToAdd = Math.floor(state.idleEggAccumulator);
    state.idleEggAccumulator -= eggsToAdd;
    
    // 批量掉落，跳过单次保存
    for (let i = 0; i < eggsToAdd; i++) {
      dropEgg(false, true);  // skipSave = true
    }
    
    // 自动售卖白蛋（静默模式）
    const autoSellLevel = state.upgrades.autoSell;
    if (autoSellLevel > 0 && state.eggs.white > 0) {
      const sellAmount = Math.min(state.eggs.white, Math.floor(minutes * autoSellLevel * 5));
      if (sellAmount > 0) {
        sellEgg('white', sellAmount, true);  // silent = true
      }
    }
    
    state.lastIdleTick = now;
    
    if (eggsToAdd > 0) {
      return eggsToAdd;
    }
  }
  
  return 0;
}

export function calculateOfflineEarnings() {
  const now = Date.now();
  const elapsed = now - state.lastIdleTick;
  const idleRate = getIdleRate();
  
  // 最多计算 2 小时的离线奖励
  const cappedElapsed = Math.min(elapsed, 120 * 60000);
  const minutes = cappedElapsed / CONFIG.IDLE_INTERVAL_MS;
  const offlineEggsDecimal = minutes * idleRate;
  
  // 加入累积器
  state.idleEggAccumulator += offlineEggsDecimal;
  
  // 只掉落整数个蛋
  const offlineEggs = Math.floor(state.idleEggAccumulator);
  state.idleEggAccumulator -= offlineEggs;
  
  // 批量掉落，跳过单次保存
  if (offlineEggs > 0) {
    for (let i = 0; i < offlineEggs; i++) {
      dropEgg(false, true);  // skipSave = true
    }
  }
  
  // 总是更新 lastIdleTick，防止重复计算
  state.lastIdleTick = now;
  saveGame();  // 立即保存，确保下次不会重复
  
  return offlineEggs;
}

// ==================== 音效系统 ====================

// 音效映射表
const soundMap = {
  click: '/music/computer-mouse-click.mp3',
  sell: '/music/sell.mp3',
  upgrade: '/music/level-up.mp3',
  reward: '/music/reward.mp3'
};

// 音效缓存
const audioCache = {};
let audioInitialized = false;

// 初始化音效系统（需要用户交互后调用）
export function initAudio() {
  if (audioInitialized) return;
  
  try {
    // 预加载音效文件
    Object.values(soundMap).forEach(soundPath => {
      if (!audioCache[soundPath]) {
        const audio = new Audio(soundPath);
        audio.volume = 0.3;
        audioCache[soundPath] = audio;
      }
    });
    
    audioInitialized = true;
    console.log('✅ 音效系统初始化成功');
  } catch (error) {
    console.error('❌ 音效系统初始化失败:', error);
  }
}

export function playSound(type) {
  if (!state.soundEnabled) return;
  
  const soundPath = soundMap[type];
  if (!soundPath) {
    console.warn(`⚠️ 未找到音效: ${type}`);
    return;
  }
  
  try {
    // 使用缓存或创建新的 Audio 实例
    let audio;
    if (audioCache[soundPath]) {
      audio = audioCache[soundPath].cloneNode();
    } else {
      audio = new Audio(soundPath);
      audioCache[soundPath] = audio;
    }
    
    // 设置音量
    audio.volume = 0.3;
    
    // 播放音效
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`🔊 播放音效: ${type}`);
        })
        .catch(error => {
          console.warn(`⚠️ 音效播放失败 (${type}):`, error.message);
        });
    }
  } catch (error) {
    console.error(`❌ 音效播放错误 (${type}):`, error);
  }
}

// ==================== 存档管理 ====================

export function exportSave() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xiaoji-save-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // 使用安全加载函数，防止原型污染
      const safeData = safeLoadImportedData(data);
      
      if (!safeData) {
        console.error('❌ 导入失败：检测到不安全的存档数据');
        if (onError) onError(new Error('检测到不安全的存档数据'));
        return;
      }
      
      Object.assign(state, safeData);
      
      // 强制重置 isResetting 标记
      state.isResetting = false;
      
      saveGame();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('❌ 导入错误:', err);
      if (onError) onError(err);
    }
  };
  reader.readAsText(file);
}

export function resetGame() {
  // 设置重置标记，防止定时器在刷新前保存数据
  state.isResetting = true;
  
  // 删除存档
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  console.log('✅ 游戏存档已清除，即将刷新...');
  
  // 立即刷新页面
  location.reload();
}
