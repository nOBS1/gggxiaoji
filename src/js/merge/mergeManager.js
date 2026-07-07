import { MergeGame } from './mergeCore.js';

const STORAGE_KEY = 'merge-block-best-score-v1';

function loadBestScore() {
  const saved = Number.parseInt(localStorage.getItem(STORAGE_KEY), 10);
  return Number.isFinite(saved) && saved > 0 ? saved : 0;
}

function saveBestScore(score) {
  localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(score))));
}

function getTileColor(value) {
  const colorMap = {
    2: '#dbeafe',
    4: '#bbf7d0',
    8: '#fde68a',
    16: '#fdba74',
    32: '#fca5a5',
    64: '#f87171',
    128: '#93c5fd',
    256: '#38bdf8',
    512: '#c4b5fd',
    1024: '#a78bfa',
    2048: '#111827'
  };

  return colorMap[value] || '#0f172a';
}

function getTileTextColor(value) {
  return value >= 64 || value === 16 ? '#ffffff' : '#172033';
}

function getTileFontSize(value) {
  if (value >= 1024) return 'clamp(1.4rem, 6vw, 2.1rem)';
  if (value >= 128) return 'clamp(1.75rem, 7vw, 2.8rem)';
  return 'clamp(2.1rem, 9vw, 3.5rem)';
}

export class MergeManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.game = new MergeGame();
    this.gridElement = null;
    this.scoreElement = null;
    this.bestScoreElement = null;
    this.statusElement = null;
    this.bestScore = loadBestScore();
    this.isAnimating = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.keydownHandler = null;
    this.resizeHandler = null;

    this.init();
  }

  init() {
    this.render();
    this.startNewGame();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="merge-game-header">
        <div class="merge-score-container">
          <div class="merge-score-box">
            <span class="merge-score-label">得分</span>
            <span class="merge-score-value" id="mergeScore">0</span>
          </div>
          <div class="merge-score-box">
            <span class="merge-score-label">最高</span>
            <span class="merge-score-value" id="mergeBestScore">${this.bestScore}</span>
          </div>
        </div>
        <button class="merge-btn" id="mergeNewGameBtn" type="button">新游戏</button>
      </div>

      <div class="merge-grid-container" id="mergeGridContainer">
        <div class="merge-grid" id="mergeGrid">
          ${this.renderGridCells()}
        </div>
      </div>

      <div class="merge-status" id="mergeStatus" aria-live="polite"></div>
    `;

    this.gridElement = document.getElementById('mergeGrid');
    this.scoreElement = document.getElementById('mergeScore');
    this.bestScoreElement = document.getElementById('mergeBestScore');
    this.statusElement = document.getElementById('mergeStatus');
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
    this.isAnimating = false;
    this.setStatus('');
    this.updateDisplay();

    requestAnimationFrame(() => {
      this.renderTiles();
    });
  }

  attachEventListeners() {
    this.keydownHandler = (event) => {
      const directionMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const direction = directionMap[event.key];

      if (!direction) return;
      event.preventDefault();
      if (!this.isAnimating) {
        this.handleMove(direction);
      }
    };

    document.addEventListener('keydown', this.keydownHandler);

    this.gridElement.addEventListener(
      'touchstart',
      (event) => {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        event.preventDefault();
      },
      { passive: false }
    );

    this.gridElement.addEventListener(
      'touchmove',
      (event) => {
        event.preventDefault();
      },
      { passive: false }
    );

    this.gridElement.addEventListener('touchend', (event) => {
      if (this.isAnimating) return;

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      const minSwipeDistance = 44;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        this.handleMove(deltaX > 0 ? 'right' : 'left');
      } else if (Math.abs(deltaY) > minSwipeDistance) {
        this.handleMove(deltaY > 0 ? 'down' : 'up');
      }

      event.preventDefault();
    });

    document.getElementById('mergeNewGameBtn')?.addEventListener('click', () => {
      if (this.game.getScore() === 0 || confirm('确定开始新游戏吗？')) {
        this.startNewGame();
      }
    });

    this.resizeHandler = () => {
      window.requestAnimationFrame(() => this.renderTiles());
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  handleMove(direction) {
    const result = this.game.move(direction);

    if (!result.moved) return;

    this.isAnimating = true;
    this.setStatus('');
    this.updateDisplay();
    this.renderTiles();
    this.updateBestScore();

    setTimeout(() => {
      this.isAnimating = false;
      if (result.isGameOver) {
        this.handleGameOver();
      }
    }, 180);
  }

  renderTiles() {
    if (!this.gridElement) return;

    this.gridElement.querySelectorAll('.merge-tile').forEach((tile) => tile.remove());

    const containerWidth = this.gridElement.offsetWidth;
    if (containerWidth === 0) {
      setTimeout(() => this.renderTiles(), 100);
      return;
    }

    const computedStyle = window.getComputedStyle(this.gridElement);
    const gap = Number.parseFloat(computedStyle.gap) || 12;
    const cellSize = (containerWidth - gap * 3) / 4;
    const grid = this.game.getGrid();

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

  updateBestScore() {
    const currentScore = this.game.getScore();
    if (currentScore <= this.bestScore) return;

    this.bestScore = currentScore;
    this.bestScoreElement.textContent = this.bestScore;
    saveBestScore(this.bestScore);
  }

  resetBestScore() {
    this.bestScore = 0;
    saveBestScore(0);
    this.bestScoreElement.textContent = '0';
  }

  setStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  handleGameOver() {
    const finalScore = this.game.getScore();

    const overlay = document.createElement('div');
    overlay.className = 'merge-game-over';
    overlay.innerHTML = `
      <div class="merge-game-over-title">游戏结束</div>
      <div class="merge-game-over-score">
        <div>得分：${finalScore}</div>
        <div>最高数字：${this.game.getMaxTile()}</div>
      </div>
      <div class="merge-game-over-buttons">
        <button class="merge-btn" id="mergeRestartBtn" type="button">再来一局</button>
        <button class="merge-btn merge-btn-muted" id="mergeDoneBtn" type="button">停在这里</button>
      </div>
    `;

    document.getElementById('mergeGridContainer').appendChild(overlay);

    document.getElementById('mergeRestartBtn').addEventListener('click', () => {
      overlay.remove();
      this.startNewGame();
    });

    document.getElementById('mergeDoneBtn').addEventListener('click', () => {
      overlay.remove();
      this.setStatus('本局已结束');
    });
  }

  destroy() {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.container.innerHTML = '';
  }
}
