/**
 * UI 更新模块
 * 负责所有界面的渲染和更新
 */

import { CONFIG } from './config.js';
import { i18n, t } from './i18n.js';
import { state } from './state.js';
import { getIdleRate, getClickPower, calculateUpgradeCost, getTasks } from './gameLogic.js';

// ==================== 辅助函数 ====================

export function getRarityName(rarity) {
  const data = CONFIG.RARITIES[rarity];
  return data ? t(i18n, state.language, data.nameKey) : rarity;
}

export function getFeedName(tier) {
  const names = ['feedNormal', 'feedAdvanced', 'feedPremium'];
  return t(i18n, state.language, names[tier] || 'feedNormal');
}

// ==================== 浮动文字 ====================

export function showFloatText(x, y, text) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  
  setTimeout(() => el.remove(), 1000);
}

// ==================== 掉落通知 ====================

export function showDropNotification(rarity) {
  const data = CONFIG.RARITIES[rarity];
  const notification = document.createElement('div');
  notification.className = 'drop-notification';
  notification.innerHTML = `
    <div class="egg-icon"><img src="${data.image}" alt="${getRarityName(rarity)}" class="egg-img" /></div>
    <div class="rarity-name" style="color: var(--rarity-${rarity})">${getRarityName(rarity)}</div>
    <p>${t(i18n, state.language, 'dropRare')}</p>
  `;
  
  document.body.appendChild(notification);
  document.getElementById('modalOverlay').classList.add('active');
  
  setTimeout(() => {
    notification.remove();
    document.getElementById('modalOverlay').classList.remove('active');
  }, 2000);
}

// ==================== 顶部状态栏 ====================

export function updateTopBar() {
  const totalEggs = Object.values(state.eggs).reduce((sum, count) => sum + count, 0);
  
  const totalEggsEl = document.getElementById('totalEggsDisplay');
  const coinsEl = document.getElementById('coinsDisplay');
  const levelEl = document.getElementById('levelDisplay');
  const feedEl = document.getElementById('feedDisplay');
  const idleRateEl = document.getElementById('idleRateDisplay');
  const clickPowerEl = document.getElementById('clickPowerDisplay');
  
  if (totalEggsEl) totalEggsEl.textContent = totalEggs.toLocaleString();
  if (coinsEl) coinsEl.textContent = state.coins.toLocaleString();
  if (levelEl) levelEl.textContent = state.upgrades.level;
  if (feedEl) feedEl.textContent = getFeedName(state.upgrades.feed);
  if (idleRateEl) idleRateEl.textContent = getIdleRate().toFixed(1);  // 显示1位小数
  if (clickPowerEl) clickPowerEl.textContent = getClickPower();
  
  // 更新语言按钮显示
  const currentLangEl = document.getElementById('currentLang');
  if (currentLangEl) {
    currentLangEl.textContent = state.language === 'zh' ? '🌍 CN' : '🌍 EN';
  }
  
  // 更新标签文本
  updateStaticTexts();
}

// ==================== 啄米进度条 ====================

export function updatePeckBar() {
  const progress = Math.min(100, state.peckProgress);
  const bar = document.getElementById('peckBar');
  if (bar) {
    bar.style.width = progress + '%';
    bar.textContent = Math.floor(progress) + '%';
  }
}

// ==================== 背包界面 ====================

export function updateInventory() {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  for (let [rarity, data] of Object.entries(CONFIG.RARITIES)) {
    const card = document.createElement('div');
    card.className = 'egg-card';
    card.style.borderColor = `var(--rarity-${rarity})`;
    card.innerHTML = `
      <div class="egg-icon"><img src="${data.image}" alt="${getRarityName(rarity)}" class="egg-img" /></div>
      <div class="egg-name">${getRarityName(rarity)}</div>
      <div class="egg-count">${state.eggs[rarity]}</div>
    `;
    grid.appendChild(card);
  }
}

// ==================== 商店界面 ====================

export function updateShop() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  // 定义可以在商店销售的蛋类（只允许白蛋、棕蛋、银蛋）
  const sellableRarities = ['white', 'brown', 'silver'];
  
  for (let [rarity, data] of Object.entries(CONFIG.RARITIES)) {
    // 跳过不能销售的蛋类（紫蛋、金蛋、黑蛋）
    if (!sellableRarities.includes(rarity)) {
      continue;
    }
    
    const card = document.createElement('div');
    card.className = 'shop-item';
    const count = state.eggs[rarity];
    card.innerHTML = `
      <div class="egg-icon"><img src="${data.image}" alt="${getRarityName(rarity)}" class="egg-img" /></div>
      <div class="egg-name">${getRarityName(rarity)}</div>
      <div style="margin: 10px 0;">${t(i18n, state.language, 'stock')}: ${count}</div>
      <div style="color: var(--success); font-weight: 600;">${t(i18n, state.language, 'price')}: ${data.price} 💰</div>
      <button class="sell-btn" data-action="sell" data-rarity="${rarity}" data-amount="1" ${count === 0 ? 'disabled' : ''}>
        ${t(i18n, state.language, 'sellOne')}
      </button>
      <button class="sell-btn" data-action="sell" data-rarity="${rarity}" data-amount="10" ${count < 10 ? 'disabled' : ''} style="margin-top: 5px;">
        ${t(i18n, state.language, 'sellTen')}
      </button>
    `;
    grid.appendChild(card);
  }
}

// ==================== 升级界面 ====================

export function updateUpgrades() {
  const grid = document.getElementById('upgradeGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  for (let [key, config] of Object.entries(CONFIG.UPGRADES)) {
    const currentLevel = state.upgrades[key];
    const isMaxed = currentLevel >= config.maxLevel;
    
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    
    // 添加金币升级的特殊样式
    if (config.costType === 'coins') {
      card.style.borderColor = 'var(--primary)';
      card.style.background = 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
    }
    
    let costHTML = '';
    if (!isMaxed) {
      const cost = calculateUpgradeCost(key, currentLevel);
      
      // 如果是金币升级
      if (config.costType === 'coins') {
        const have = state.coins;
        const color = have >= cost ? 'green' : 'red';
        costHTML = `<span class="cost-item" style="color: ${color}; font-size: 16px; font-weight: 700;">💰 ${cost}</span>`;
      } else {
        // 普通蛋升级
        costHTML = Object.entries(cost).map(([rarity, amount]) => {
          const have = state.eggs[rarity];
          const color = have >= amount ? 'green' : 'red';
          const rarityData = CONFIG.RARITIES[rarity];
          return `<span class="cost-item" style="color: ${color}"><img src="${rarityData.image}" alt="${rarity}" class="egg-img-small" /> ${amount}</span>`;
        }).join('');
      }
    }
    
    let effectText = '';
    if (key === 'feed') {
      effectText = `${t(i18n, state.language, 'current')}: ${getFeedName(currentLevel)}`;
    } else if (key === 'clickPower') {
      effectText = `${t(i18n, state.language, 'current')}: +${getClickPower()}% ${t(i18n, state.language, 'perClick')}`;
    } else if (key === 'idleRate') {
      effectText = `${t(i18n, state.language, 'current')}: ${getIdleRate().toFixed(1)} ${t(i18n, state.language, 'eggsPerMin')}`;  // 显示1位小数
    } else if (key === 'level') {
      effectText = `${t(i18n, state.language, 'currentLevel')}: ${currentLevel}`;
    } else if (key === 'luckyChance') {
      const bonus = currentLevel * 5;
      effectText = `${t(i18n, state.language, 'current')}: +${bonus}% ${t(i18n, state.language, 'rareDrop')}`;
    } else if (key === 'autoSell') {
      const amount = currentLevel * 5;
      effectText = `${t(i18n, state.language, 'current')}: ${amount} ${t(i18n, state.language, 'eggsPerMin')}`;
    } else if (key === 'goldBonus') {
      const bonus = currentLevel * 10;
      effectText = `${t(i18n, state.language, 'current')}: +${bonus}% ${t(i18n, state.language, 'coinGain')}`;
    }
    
    card.innerHTML = `
      <div class="upgrade-title">${t(i18n, state.language, 'upgradeName.' + key)}</div>
      <div class="upgrade-level">${t(i18n, state.language, 'upgradeDesc.' + key)}</div>
      <div class="upgrade-level">${effectText}</div>
      <div class="upgrade-cost">${costHTML || t(i18n, state.language, 'maxLevel')}</div>
      <button class="upgrade-btn" data-action="upgrade" data-key="${key}" ${isMaxed ? 'disabled' : ''}>
        ${isMaxed ? t(i18n, state.language, 'maxLevel') : t(i18n, state.language, 'upgrade')}
      </button>
    `;
    
    grid.appendChild(card);
  }
}

// ==================== 任务界面 ====================

export function updateTasks() {
  const list = document.getElementById('taskList');
  if (!list) return;
  list.innerHTML = '';
  
  const tasks = getTasks();
  const taskNames = {
    'daily_click': { title: 'taskDailyClick', desc: 'taskDailyClickDesc' },
    'daily_sell': { title: 'taskDailySell', desc: 'taskDailySellDesc' }
  };
  
  for (let task of tasks) {
    const taskName = taskNames[task.id];
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <div class="task-info">
        <div class="task-title">${t(i18n, state.language, taskName.title)}</div>
        <div class="task-progress">${t(i18n, state.language, 'taskProgress')}: ${task.progress} / ${task.target}</div>
        <div class="task-reward">${t(i18n, state.language, 'reward')}: ${Object.entries(task.reward).map(([r, a]) => `${a} <img src="${CONFIG.RARITIES[r].image}" alt="${r}" class="egg-img-small" />`).join(', ')}</div>
      </div>
      <button class="claim-btn" data-action="claim-task" data-task="${task.id}" ${!task.completed || task.claimed ? 'disabled' : ''}>
        ${task.claimed ? '✅ 已领取' : (task.completed ? t(i18n, state.language, 'claim') : t(i18n, state.language, 'incomplete'))}
      </button>
    `;
    list.appendChild(card);
  }
}

// ==================== 广告界面 ====================

export function updateAdButton() {
  const btn = document.getElementById('watchAdBtn');
  const cooldown = document.getElementById('adCooldown');
  
  if (!btn || !cooldown) return;
  
  cooldown.textContent = state.adCooldown;
  
  const canWatch = state.adCooldown === 0;
  btn.disabled = !canWatch;
  
  if (canWatch) {
    btn.textContent = t(i18n, state.language, 'watchAd');
  }
}

// ==================== 静态文本更新 ====================

export function updateStaticTexts() {
  // 更新所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(i18n, state.language, key);
    if (translated) {
      el.textContent = translated;
    }
  });
}

// ==================== 全局更新 ====================

export function updateAllDisplays() {
  updateTopBar();
  updatePeckBar();
  updateInventory();
  updateShop();
  updateUpgrades();
  updateTasks();
  updateAdButton();
}
