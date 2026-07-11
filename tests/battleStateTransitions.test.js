import { describe, expect, test } from 'vitest';
import {
  createBattle,
  endTurn,
  mulliganOpeningHand,
  startBattle
} from '../src/js/battle/battleCore.js';
import { BATTLE_CARDS } from '../src/js/battle/cardDefinitions.js';
import { STANDARD_DECK } from './fixtures/battleFixtures.js';

describe('battle state transitions', () => {
  test('creates an opening phase with four cards for each side', () => {
    const battle = createBattle({
      playerDeck: STANDARD_DECK,
      enemyDeck: STANDARD_DECK,
      shuffle: false
    });

    expect(battle.phase).toBe('opening');
    expect(battle.activeSide).toBeNull();
    expect(battle.player.hand).toHaveLength(4);
    expect(battle.enemy.hand).toHaveLength(4);
  });

  test('allows one full mulligan without mutating the original battle', () => {
    const original = createBattle({
      playerDeck: STANDARD_DECK,
      enemyDeck: STANDARD_DECK,
      shuffle: false
    });
    const openingCardIds = original.player.hand.map((card) => card.cardId);

    const result = mulliganOpeningHand(original, 'player');

    expect(result.ok).toBe(true);
    expect(result.battle).not.toBe(original);
    expect(original.player.hand.map((card) => card.cardId)).toEqual(openingCardIds);
    expect(result.battle.player.hand.map((card) => card.cardId)).not.toEqual(openingCardIds);
    expect(mulliganOpeningHand(result.battle, 'player')).toMatchObject({
      ok: false,
      reason: 'MULLIGAN_ALREADY_USED'
    });
  });

  test('draws at the start of both first turns and returns new states', () => {
    const opening = createBattle({
      playerDeck: STANDARD_DECK,
      enemyDeck: STANDARD_DECK,
      shuffle: false
    });

    const started = startBattle(opening);
    const enemyTurn = endTurn(started.battle);

    expect(started.ok).toBe(true);
    expect(started.battle).not.toBe(opening);
    expect(started.battle.activeSide).toBe('player');
    expect(started.battle.player.hand).toHaveLength(5);
    expect(enemyTurn.battle).not.toBe(started.battle);
    expect(enemyTurn.battle.enemy.hand).toHaveLength(5);
    expect(started.battle.enemy.hand).toHaveLength(4);
  });

  test('every battle card declares a rarity', () => {
    expect(BATTLE_CARDS.every((card) => ['SR', 'SSR'].includes(card.rarity))).toBe(true);
  });
});
