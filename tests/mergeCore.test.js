import { describe, expect, test } from 'vitest';
import { MergeGame } from '../src/js/merge/mergeCore.js';

function createGameWithGrid(grid) {
  const game = new MergeGame();
  game.grid = grid.map((row) => [...row]);
  game.score = 0;
  game.addRandomTile = () => null;
  return game;
}

describe('MergeGame', () => {
  test('creates an empty 4x4 grid', () => {
    const game = new MergeGame();

    expect(game.createEmptyGrid()).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
  });

  test('merges equal tiles to the left and updates score', () => {
    const game = createGameWithGrid([
      [2, 2, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);

    const result = game.move('left');

    expect(result.moved).toBe(true);
    expect(game.getGrid()[0]).toEqual([4, 4, 0, 0]);
    expect(game.getScore()).toBe(4);
  });

  test('merges each tile only once per move', () => {
    const game = createGameWithGrid([
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);

    game.move('left');

    expect(game.getGrid()[0]).toEqual([4, 4, 0, 0]);
    expect(game.getScore()).toBe(8);
  });

  test('detects game over when no cells or merges remain', () => {
    const game = createGameWithGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ]);

    expect(game.isGameOver()).toBe(true);
  });

  test('keeps the game alive when a merge is available', () => {
    const game = createGameWithGrid([
      [2, 2, 4, 8],
      [4, 8, 16, 32],
      [8, 16, 32, 64],
      [16, 32, 64, 128]
    ]);

    expect(game.isGameOver()).toBe(false);
  });
});
