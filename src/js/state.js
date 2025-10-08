import { CONFIG } from './config.js';

// 默认状态
const DEFAULT_STATE = {
  eggs: { white: 0, brown: 0, silver: 0, gold: 0, purple: 0, black: 0 },
  coins: 0,
  upgrades: { 
    level: 1, 
    feed: 0, 
    clickPower: 0, 
    idleRate: 0,
    luckyChance: 0,
    autoSell: 0,
    goldBonus: 0
  },
  peckProgress: 0,
  idleEggAccumulator: 0,
  lastIdleTick: Date.now(),
  totalClicks: 0,
  totalEggsSold: 0,
  blackPityCounter: 0,
  adCooldown: 0,
  adWatchedToday: 0,
  lastAdDate: null,
  dailyTasks: { 
    clicks: 0, 
    sellSilver: 0,
    clickTaskClaimed: false,
    sellTaskClaimed: false
  },
  soundEnabled: true,
  language: 'zh',
  isKeyPressed: false
};

// 初始化 state 为默认值
export const state = { 
  ...DEFAULT_STATE,
  isResetting: false  // 重置标记，防止重置时保存
};

// 安全的白名单字段
const SAFE_FIELDS = [
  'eggs', 'coins', 'upgrades', 'peckProgress', 'idleEggAccumulator',
  'lastIdleTick', 'totalClicks', 'totalEggsSold', 'blackPityCounter',
  'adCooldown', 'adWatchedToday', 'lastAdDate', 'dailyTasks',
  'soundEnabled', 'language', 'isKeyPressed'
];

const SAFE_EGG_TYPES = ['white', 'brown', 'silver', 'gold', 'purple', 'black'];
const SAFE_UPGRADE_TYPES = ['level', 'feed', 'clickPower', 'idleRate', 'luckyChance', 'autoSell', 'goldBonus'];
const SAFE_TASK_FIELDS = ['clicks', 'sellSilver', 'clickTaskClaimed', 'sellTaskClaimed'];

// 安全加载存档，防止原型污染
export function safeLoadImportedData(data) {
  return safeLoadData(data);
}

function safeLoadData(data) {
  if (!data || typeof data !== 'object') return null;
  
  // 检测危险字段（只检查自有属性，不检查继承的属性）
  if (Object.prototype.hasOwnProperty.call(data, '__proto__') || 
      Object.prototype.hasOwnProperty.call(data, 'constructor') || 
      Object.prototype.hasOwnProperty.call(data, 'prototype')) {
    console.error('❌ 检测到危险的原型污染尝试，拒绝加载');
    return null;
  }
  
  const safeData = {};
  
  // 拷贝白名单字段，字段不存在时使用默认值
  for (const field of SAFE_FIELDS) {
    // 特殊处理嵌套对象
    if (field === 'eggs') {
        safeData.eggs = {};
        for (const eggType of SAFE_EGG_TYPES) {
          if (field in data && data.eggs && eggType in data.eggs && typeof data.eggs[eggType] === 'number') {
            safeData.eggs[eggType] = Math.max(0, Math.floor(data.eggs[eggType]));
          } else {
            safeData.eggs[eggType] = 0;
          }
        }
      } else if (field === 'upgrades') {
        safeData.upgrades = {};
        for (const upgradeType of SAFE_UPGRADE_TYPES) {
          const upgradeConfig = CONFIG.UPGRADES[upgradeType];
          const minLevel = upgradeType === 'level' ? 1 : 0;
          const maxLevel = upgradeConfig ? upgradeConfig.maxLevel : 20;
          
          if (field in data && data.upgrades && upgradeType in data.upgrades && typeof data.upgrades[upgradeType] === 'number') {
            // 夹紧到 [minLevel, maxLevel] 范围
            const rawValue = Math.floor(data.upgrades[upgradeType]);
            safeData.upgrades[upgradeType] = Math.max(minLevel, Math.min(rawValue, maxLevel));
            
            // 如果超出范围，警告用户
            if (rawValue < minLevel || rawValue > maxLevel) {
              console.warn(`⚠️ upgrades.${upgradeType} 超出范围 [${minLevel}, ${maxLevel}]，已修正为 ${safeData.upgrades[upgradeType]}`);
            }
          } else {
            safeData.upgrades[upgradeType] = minLevel;
          }
        }
      } else if (field === 'dailyTasks') {
        safeData.dailyTasks = {};
        for (const taskField of SAFE_TASK_FIELDS) {
          const defaultValue = taskField.includes('Claimed') ? false : 0;
          
          if (field in data && data.dailyTasks && taskField in data.dailyTasks) {
            const value = data.dailyTasks[taskField];
            const expectedType = typeof defaultValue;
            
            // 类型匹配时使用实际值，不匹配时回落到默认值
            if (typeof value === expectedType) {
              if (expectedType === 'boolean') {
                safeData.dailyTasks[taskField] = Boolean(value);
              } else if (expectedType === 'number') {
                safeData.dailyTasks[taskField] = Math.max(0, Math.floor(value));
              } else {
                safeData.dailyTasks[taskField] = defaultValue;
              }
            } else {
              // 类型不匹配，回落到默认值
              console.warn(`⚠️ dailyTasks.${taskField} 类型不匹配，使用默认值`);
              safeData.dailyTasks[taskField] = defaultValue;
            }
          } else {
            // 字段不存在，使用默认值
            safeData.dailyTasks[taskField] = defaultValue;
          }
        }
      } else {
        // 类型校验
        const defaultValue = DEFAULT_STATE[field];
        
        if (field in data) {
          const value = data[field];
          const expectedType = typeof defaultValue;
          
          if (typeof value === expectedType) {
            if (expectedType === 'number') {
              safeData[field] = Math.max(0, value);
            } else if (expectedType === 'boolean') {
              safeData[field] = Boolean(value);
            } else if (expectedType === 'string') {
              safeData[field] = String(value);
            } else {
              safeData[field] = value;
            }
          } else {
            safeData[field] = defaultValue;
          }
        } else {
          // 字段不存在，使用默认值
          safeData[field] = defaultValue;
        }
      }
  }
  
  return safeData;
}

// 重置状态为默认值
function resetStateToDefault() {
  // 清空 eggs
  state.eggs = { white: 0, brown: 0, silver: 0, gold: 0, purple: 0, black: 0 };
  state.coins = 0;
  state.upgrades = { 
    level: 1, 
    feed: 0, 
    clickPower: 0, 
    idleRate: 0,
    luckyChance: 0,
    autoSell: 0,
    goldBonus: 0
  };
  state.peckProgress = 0;
  state.idleEggAccumulator = 0;
  state.lastIdleTick = Date.now();
  state.totalClicks = 0;
  state.totalEggsSold = 0;
  state.blackPityCounter = 0;
  state.adCooldown = 0;
  state.adWatchedToday = 0;
  state.lastAdDate = null;
  state.dailyTasks = { 
    clicks: 0, 
    sellSilver: 0,
    clickTaskClaimed: false,
    sellTaskClaimed: false
  };
  // 保留 soundEnabled 和 language 设置
  // state.soundEnabled 不重置
  // state.language 不重置
  state.isKeyPressed = false;
  
  console.log('✅ 状态已重置为默认值');
}

export function saveGame() {
  // 重置中不保存，防止定时器在刷新前写回数据
  if (state.isResetting) {
    console.log('⚠️ 正在重置中，跳过保存');
    return;
  }
  
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('保存失败', e);
  }
}

export function loadGame() {
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      
      // 安全加载存档
      const safeData = safeLoadData(data);
      
      if (!safeData) {
        console.warn('⚠️ 检测到旧版本或损坏的存档，自动重置...');
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        resetStateToDefault();
        return;
      }
      
      Object.assign(state, safeData);
      
      // 确保所有新字段都有默认值（向后兼容）
      if (state.coins === undefined) state.coins = 0;
      if (state.idleEggAccumulator === undefined) state.idleEggAccumulator = 0;
      if (!state.upgrades) state.upgrades = { level: 1, feed: 0, clickPower: 0, idleRate: 0, luckyChance: 0, autoSell: 0, goldBonus: 0 };
      if (state.upgrades.luckyChance === undefined) state.upgrades.luckyChance = 0;
      if (state.upgrades.autoSell === undefined) state.upgrades.autoSell = 0;
      if (state.upgrades.goldBonus === undefined) state.upgrades.goldBonus = 0;
      
      const today = new Date().toDateString();
      if (state.lastAdDate !== today) {
        state.adWatchedToday = 0;
        state.dailyTasks = { 
          clicks: 0, 
          sellSilver: 0,
          clickTaskClaimed: false,
          sellTaskClaimed: false
        };
        state.lastAdDate = today;
      }
      
      // 确保任务标记字段存在
      if (state.dailyTasks.clickTaskClaimed === undefined) state.dailyTasks.clickTaskClaimed = false;
      if (state.dailyTasks.sellTaskClaimed === undefined) state.dailyTasks.sellTaskClaimed = false;
      
      // 强制重置 isResetting 标记，防止恶意存档导致永久无法保存
      state.isResetting = false;
      
      console.log('✅ 成功加载存档');
    } else {
      // 没有存档，重置为默认值
      console.log('ℹ️ 未找到存档，使用默认值');
      resetStateToDefault();
    }
  } catch (e) {
    console.error('❌ 读取存档失败，清除存档:', e);
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    resetStateToDefault();
  }
}
