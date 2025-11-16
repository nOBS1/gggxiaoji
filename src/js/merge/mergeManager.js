/**
 * 合成游戏管理器
 * 集成UI渲染、输入控制、动画效果
 */

import { MergeGame } from './mergeCore.js';
import { 
  processMergeReward, 
  getTileColor, 
  getTileTextColor, 
  getTileFontSize,
  getSessionStats,
  resetSessionStats 
} from './mergeReward.js';
import { state, saveGame } from '../state.js';
import { CONFIG } from '../config.js';
import { i18n, t } from '../i18n.js';

export class MergeManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.game = new MergeGame();
    this.gridElement = null;
    this.scoreElement = null;
    this.bestScoreElement = null;
    this.isAnimating = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.keydownHandler = null; // 保存事件处理器引用
    
    this.init();
  }

  init() {
    // 初始化游戏状态
    if (!state.mergeGame) {
      state.mergeGame = {
        bestScore: 0,
        totalMerges: 0,
        highestTile: 0,
        sessionEggs: {
          white: 0,
          brown: 0,
          silver: 0,
          gold: 0,
          purple: 0,
          black: 0
        }
      };
    }

    this.render();
    this.startNewGame();
    this.attachEventListeners();
  }

  render() {
    const lang = state.language || 'zh';
    this.container.innerHTML = `
      <div class="merge-game-header">
        <div class="merge-score-container">
          <div class="merge-score-box">
            <span class="merge-score-label">${t(i18n, lang, 'mergeScore')}</span>
            <span class="merge-score-value" id="mergeScore">0</span>
          </div>
          <div class="merge-score-box">
            <span class="merge-score-label">${t(i18n, lang, 'mergeBest')}</span>
            <span class="merge-score-value" id="mergeBestScore">${state.mergeGame.bestScore}</span>
          </div>
        </div>
        <div class="merge-controls">
          <button class="merge-btn" id="mergeNewGameBtn">🔄 ${t(i18n, lang, 'mergeNewGame')}</button>
        </div>
      </div>

      <div class="merge-grid-container" id="mergeGridContainer">
        <div class="merge-grid" id="mergeGrid">
          ${this.renderGridCells()}
        </div>
      </div>

      <p class="merge-hint">
        💡 ${t(i18n, lang, 'mergeHint')}
      </p>

      <div class="merge-session-stats">
        <div class="merge-session-title">🥚 ${t(i18n, lang, 'mergeSessionEggs')}</div>
        <div class="merge-session-eggs" id="mergeSessionEggs">
          <span style="color: #999;">${t(i18n, lang, 'mergeSessionStart')}</span>
        </div>
      </div>
    `;

    this.gridElement = document.getElementById('mergeGrid');
    this.scoreElement = document.getElementById('mergeScore');
    this.bestScoreElement = document.getElementById('mergeBestScore');
  }

  renderGridCells() {
    let html = '';
    for (let i = 0; i < 16; i++) {
      html += '<div class="merge-cell"></div>';
    }
    return html;
  }

  startNewGame() {
    this.game.init();
    resetSessionStats();
    this.updateDisplay();
    
    // 等待DOM渲染完成后再渲染数字格子
    requestAnimationFrame(() => {
      this.renderTiles();
    });
  }

  attachEventListeners() {
    // 键盘控制 - 阻止方向键默认滚动行为
    this.keydownHandler = (e) => {
      // 只在主界面标签页时才处理键盘事件
      const mainTab = document.querySelector('.tab-content[data-content="main"]');
      if (!mainTab || !mainTab.classList.contains('active')) {
        return; // 不在主界面，不处理
      }
      
      // 先阻止所有方向键的默认行为
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
        e.preventDefault();
      }
      
      if (this.isAnimating) return;
      
      const directionMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      };

      const direction = directionMap[e.key];
      if (direction) {
        this.handleMove(direction);
      }
    };
    
    document.addEventListener('keydown', this.keydownHandler);

    // 触摸控制
    this.gridElement.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      e.preventDefault(); // 阻止触摸滚动
    }, { passive: false });

    this.gridElement.addEventListener('touchmove', (e) => {
      // 阻止滑动时的页面滚动
      e.preventDefault();
    }, { passive: false });

    this.gridElement.addEventListener('touchend', (e) => {
      if (this.isAnimating) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;

      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // 水平滑动
        this.handleMove(deltaX > 0 ? 'right' : 'left');
      } else if (Math.abs(deltaY) > minSwipeDistance) {
        // 垂直滑动
        this.handleMove(deltaY > 0 ? 'down' : 'up');
      }
      
      e.preventDefault();
    });

    // 新游戏按钮
    document.getElementById('mergeNewGameBtn').addEventListener('click', () => {
      const lang = state.language || 'zh';
      if (confirm(t(i18n, lang, 'mergeNewGameConfirm'))) {
        this.startNewGame();
      }
    });
  }

  handleMove(direction) {
    const result = this.game.move(direction);

    if (!result.moved) return;

    this.isAnimating = true;

    // 更新显示
    this.updateDisplay();
    this.renderTiles();

    // 处理合并奖励
    if (result.mergedTiles && result.mergedTiles.length > 0) {
      result.mergedTiles.forEach(tile => {
        const reward = processMergeReward(tile.value);
        if (reward) {
          this.showEggReward(reward);
        }
      });
      this.updateSessionStats();
    }

    // 更新最高分
    if (this.game.getScore() > state.mergeGame.bestScore) {
      state.mergeGame.bestScore = this.game.getScore();
      this.bestScoreElement.textContent = state.mergeGame.bestScore;
    }

    // 更新最高数字
    const maxTile = this.game.getMaxTile();
    if (maxTile > state.mergeGame.highestTile) {
      state.mergeGame.highestTile = maxTile;
    }

    saveGame();

    // 检查游戏结束
    setTimeout(() => {
      this.isAnimating = false;
      if (result.isGameOver) {
        this.handleGameOver();
      }
    }, 300);
  }

  renderTiles() {
    // 清除旧格子
    const oldTiles = this.gridElement.querySelectorAll('.merge-tile');
    oldTiles.forEach(tile => tile.remove());

    const grid = this.game.getGrid();
    
    // 获取网格容器的实际尺寸
    const gridContainer = this.gridElement;
    const containerWidth = gridContainer.offsetWidth;
    
    // 如果容器尺寸为0，延迟渲染
    if (containerWidth === 0) {
      console.warn('[MergeGame] 网格容器尺寸为0，延迟渲染');
      setTimeout(() => this.renderTiles(), 100);
      return;
    }
    
    // 获取gap值（从 CSS）
    const computedStyle = window.getComputedStyle(gridContainer);
    const gap = parseFloat(computedStyle.gap) || 15;
    
    // 计算每个格子的实际大小
    const cellSize = (containerWidth - gap * 3) / 4;
    
    console.log(`[MergeGame] 渲染格子: 容器宽度=${containerWidth}, gap=${gap}, 格子大小=${cellSize}`);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = grid[row][col];
        if (value === 0) continue;

        const tile = document.createElement('div');
        tile.className = 'merge-tile';
        tile.textContent = value;
        tile.style.background = getTileColor(value);
        tile.style.color = getTileTextColor(value);
        tile.style.fontSize = getTileFontSize(value);
        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        tile.style.left = `${col * (cellSize + gap)}px`;
        tile.style.top = `${row * (cellSize + gap)}px`;

        this.gridElement.appendChild(tile);
      }
    }
  }

  updateDisplay() {
    this.scoreElement.textContent = this.game.getScore();
  }

  updateSessionStats() {
    const stats = getSessionStats();
    const container = document.getElementById('mergeSessionEggs');
    
    let html = '';
    const eggTypes = ['white', 'brown', 'silver', 'gold', 'purple', 'black'];
    let hasEggs = false;

    eggTypes.forEach(type => {
      if (stats[type] > 0) {
        hasEggs = true;
        html += `
          <div class="merge-session-egg-item">
            <span class="merge-session-egg-emoji">${CONFIG.RARITIES[type].emoji}</span>
            <span class="merge-session-egg-count">×${stats[type]}</span>
          </div>
        `;
      }
    });

    if (!hasEggs) {
      const lang = state.language || 'zh';
      html = `<span style="color: #999;">${t(i18n, lang, 'mergeNoEggs')}</span>`;
    }

    container.innerHTML = html;
  }

  showEggReward(reward) {
    // 创建飞行的鸡蛋动画
    const egg = document.createElement('div');
    egg.textContent = reward.emoji;
    egg.style.position = 'fixed';
    egg.style.fontSize = '24px';
    egg.style.pointerEvents = 'none';
    egg.style.zIndex = '9999';
    
    // 从网格中心开始
    const gridRect = this.gridElement.getBoundingClientRect();
    egg.style.left = `${gridRect.left + gridRect.width / 2}px`;
    egg.style.top = `${gridRect.top + gridRect.height / 2}px`;
    
    document.body.appendChild(egg);

    // 动画到背包图标位置（顶部）
    setTimeout(() => {
      egg.style.transition = 'all 0.8s ease-in-out';
      egg.style.transform = 'translateY(-200px) scale(0.5)';
      egg.style.opacity = '0';
    }, 10);

    setTimeout(() => {
      egg.remove();
    }, 900);
  }

  handleGameOver() {
    const finalScore = this.game.getScore();
    const stats = getSessionStats();
    const lang = state.language || 'zh';

    // 创建游戏结束遮罩
    const overlay = document.createElement('div');
    overlay.className = 'merge-game-over';
    overlay.innerHTML = `
      <div class="merge-game-over-title">${t(i18n, lang, 'mergeGameOver')}</div>
      <div class="merge-game-over-score">
        <div>${t(i18n, lang, 'mergeScore')}: ${finalScore}</div>
        <div>${t(i18n, lang, 'mergeHighestTile')}: ${this.game.getMaxTile()}</div>
      </div>
      <div class="merge-game-over-buttons">
        <button class="merge-btn" id="mergeRestartBtn">🔄 ${t(i18n, lang, 'mergeRestart')}</button>
        <button class="merge-btn" id="mergeDoneBtn">✅ ${t(i18n, lang, 'mergeDone')}</button>
      </div>
    `;

    document.getElementById('mergeGridContainer').appendChild(overlay);

    document.getElementById('mergeRestartBtn').addEventListener('click', () => {
      overlay.remove();
      this.startNewGame();
    });

    document.getElementById('mergeDoneBtn').addEventListener('click', () => {
      overlay.remove();
    });
  }

  // 清理资源
  destroy() {
    // 移除键盘监听
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    
    // 清空容器
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    console.log('✅ 合成游戏已清理');
  }
}
