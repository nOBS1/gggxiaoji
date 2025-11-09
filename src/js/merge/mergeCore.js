/**
 * 2048核心算法模块
 * 负责网格逻辑、数字移动、合并计算
 */

export class MergeGame {
  constructor() {
    this.gridSize = 4;
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.mergedThisTurn = new Set(); // 记录本回合已合并的格子
  }

  // 创建空网格
  createEmptyGrid() {
    const grid = [];
    for (let i = 0; i < this.gridSize; i++) {
      grid.push(new Array(this.gridSize).fill(0));
    }
    return grid;
  }

  // 初始化游戏：放置2个初始数字
  init() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.addRandomTile();
    this.addRandomTile();
  }

  // 添加随机数字（2或4）
  addRandomTile() {
    const emptyCells = [];
    
    // 找出所有空格子
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) return false;

    // 随机选择一个空格
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // 90% 概率生成2，10% 概率生成4
    this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    
    return { row, col, value: this.grid[row][col] };
  }

  // 移动：up, down, left, right
  move(direction) {
    this.mergedThisTurn.clear();
    let moved = false;
    let mergedTiles = []; // 记录合并的格子信息

    const oldGrid = JSON.parse(JSON.stringify(this.grid));

    switch (direction) {
      case 'up':
        moved = this.moveUp(mergedTiles);
        break;
      case 'down':
        moved = this.moveDown(mergedTiles);
        break;
      case 'left':
        moved = this.moveLeft(mergedTiles);
        break;
      case 'right':
        moved = this.moveRight(mergedTiles);
        break;
    }

    // 如果有移动，添加新数字
    let newTile = null;
    if (moved) {
      newTile = this.addRandomTile();
    }

    return {
      moved,
      mergedTiles,
      newTile,
      isGameOver: this.isGameOver()
    };
  }

  // 向上移动
  moveUp(mergedTiles) {
    let moved = false;
    
    for (let col = 0; col < this.gridSize; col++) {
      const column = [];
      
      // 提取非零值
      for (let row = 0; row < this.gridSize; row++) {
        if (this.grid[row][col] !== 0) {
          column.push(this.grid[row][col]);
        }
      }
      
      // 合并相同数字
      const merged = this.mergeArray(column, mergedTiles, col, 'up');
      
      // 写回网格
      for (let row = 0; row < this.gridSize; row++) {
        const newValue = merged[row] || 0;
        if (this.grid[row][col] !== newValue) {
          moved = true;
        }
        this.grid[row][col] = newValue;
      }
    }
    
    return moved;
  }

  // 向下移动
  moveDown(mergedTiles) {
    let moved = false;
    
    for (let col = 0; col < this.gridSize; col++) {
      const column = [];
      
      // 从下往上提取非零值
      for (let row = this.gridSize - 1; row >= 0; row--) {
        if (this.grid[row][col] !== 0) {
          column.push(this.grid[row][col]);
        }
      }
      
      // 合并相同数字
      const merged = this.mergeArray(column, mergedTiles, col, 'down');
      
      // 从下往上写回网格
      for (let row = this.gridSize - 1; row >= 0; row--) {
        const idx = this.gridSize - 1 - row;
        const newValue = merged[idx] || 0;
        if (this.grid[row][col] !== newValue) {
          moved = true;
        }
        this.grid[row][col] = newValue;
      }
    }
    
    return moved;
  }

  // 向左移动
  moveLeft(mergedTiles) {
    let moved = false;
    
    for (let row = 0; row < this.gridSize; row++) {
      const rowArray = [];
      
      // 提取非零值
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] !== 0) {
          rowArray.push(this.grid[row][col]);
        }
      }
      
      // 合并相同数字
      const merged = this.mergeArray(rowArray, mergedTiles, row, 'left');
      
      // 写回网格
      for (let col = 0; col < this.gridSize; col++) {
        const newValue = merged[col] || 0;
        if (this.grid[row][col] !== newValue) {
          moved = true;
        }
        this.grid[row][col] = newValue;
      }
    }
    
    return moved;
  }

  // 向右移动
  moveRight(mergedTiles) {
    let moved = false;
    
    for (let row = 0; row < this.gridSize; row++) {
      const rowArray = [];
      
      // 从右往左提取非零值
      for (let col = this.gridSize - 1; col >= 0; col--) {
        if (this.grid[row][col] !== 0) {
          rowArray.push(this.grid[row][col]);
        }
      }
      
      // 合并相同数字
      const merged = this.mergeArray(rowArray, mergedTiles, row, 'right');
      
      // 从右往左写回网格
      for (let col = this.gridSize - 1; col >= 0; col--) {
        const idx = this.gridSize - 1 - col;
        const newValue = merged[idx] || 0;
        if (this.grid[row][col] !== newValue) {
          moved = true;
        }
        this.grid[row][col] = newValue;
      }
    }
    
    return moved;
  }

  // 合并数组（核心逻辑）
  mergeArray(arr, mergedTiles, lineIndex, direction) {
    const result = [];
    let i = 0;
    
    while (i < arr.length) {
      if (i < arr.length - 1 && arr[i] === arr[i + 1]) {
        // 相同数字合并
        const mergedValue = arr[i] * 2;
        result.push(mergedValue);
        this.score += mergedValue;
        
        // 记录合并信息
        mergedTiles.push({
          value: mergedValue,
          position: this.getPositionFromIndex(lineIndex, result.length - 1, direction)
        });
        
        i += 2; // 跳过两个数字
      } else {
        result.push(arr[i]);
        i++;
      }
    }
    
    return result;
  }

  // 根据方向和索引计算实际位置
  getPositionFromIndex(lineIndex, index, direction) {
    switch (direction) {
      case 'up':
      case 'down':
        return { row: index, col: lineIndex };
      case 'left':
      case 'right':
        return { row: lineIndex, col: index };
    }
  }

  // 判断游戏是否结束
  isGameOver() {
    // 还有空格，游戏继续
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === 0) return false;
      }
    }

    // 检查是否还能合并
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const current = this.grid[row][col];
        
        // 检查右边
        if (col < this.gridSize - 1 && current === this.grid[row][col + 1]) {
          return false;
        }
        
        // 检查下边
        if (row < this.gridSize - 1 && current === this.grid[row + 1][col]) {
          return false;
        }
      }
    }

    return true; // 无法移动，游戏结束
  }

  // 获取最大数字
  getMaxTile() {
    let max = 0;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] > max) {
          max = this.grid[row][col];
        }
      }
    }
    return max;
  }

  // 获取网格副本
  getGrid() {
    return JSON.parse(JSON.stringify(this.grid));
  }

  // 获取得分
  getScore() {
    return this.score;
  }
}
