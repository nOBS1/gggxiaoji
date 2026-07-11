import { describe, expect, test } from 'vitest';
import { createBattle, endTurn, startBattle } from '../src/js/battle/battleCore.js';
import { runAiStep, runAiTurn } from '../src/js/battle/battleAi.js';
import { STANDARD_DECK } from './fixtures/battleFixtures.js';

describe('battle AI', () => {
  test('exposes one visible action at a time during the AI turn', () => {
    const opening = createBattle({
      playerDeck: STANDARD_DECK,
      enemyDeck: STANDARD_DECK,
      shuffle: false
    });
    let battle = startBattle(opening).battle;
    battle = endTurn(battle).battle;
    battle = runAiTurn(battle).battle;
    battle = endTurn(battle).battle;

    const result = runAiStep(battle);

    expect(result.ok).toBe(true);
    expect(result.done).toBe(false);
    expect(result.action).toMatchObject({ type: 'deploy', cardId: 'liu-bei' });
    expect(result.battle.activeSide).toBe('enemy');
  });

  test('deploys an affordable unit and returns the turn to the player', () => {
    const opening = createBattle({
      playerDeck: STANDARD_DECK,
      enemyDeck: STANDARD_DECK,
      shuffle: false
    });
    let battle = startBattle(opening).battle;
    battle = endTurn(battle).battle;
    battle = runAiTurn(battle).battle;
    battle = endTurn(battle).battle;

    const result = runAiTurn(battle);

    expect(result.ok).toBe(true);
    expect(result.actions).toContainEqual(
      expect.objectContaining({ type: 'deploy', cardId: 'liu-bei' })
    );
    expect(result.battle.enemy.battlefield.some(Boolean)).toBe(true);
    expect(result.battle.activeSide).toBe('player');
  });
});
