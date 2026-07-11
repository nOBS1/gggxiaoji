import { describe, expect, test } from 'vitest';
import { attack, createBattle, endTurn, playCard, startBattle } from '../src/js/battle/battleCore.js';
import { getBattleCardDefinition } from '../src/js/battle/cardDefinitions.js';
import { STANDARD_DECK } from './fixtures/battleFixtures.js';

describe('battle simulation', () => {
  test('a deterministic battle reaches a winner without stalling', () => {
    const opening = createBattle({
      playerDeck: STANDARD_DECK,
      enemyDeck: STANDARD_DECK,
      shuffle: false
    });
    let battle = startBattle(opening).battle;
    let completedTurns = 0;

    while (!battle.winner && completedTurns < 80) {
      battle = playAffordableCards(battle);
      battle = attackWithReadyUnits(battle);
      if (!battle.winner) battle = endTurn(battle).battle;
      completedTurns += 1;
    }

    expect(['player', 'enemy']).toContain(battle.winner);
    expect(completedTurns).toBeLessThan(80);
  });
});

function playAffordableCards(battle) {
  let next = battle;
  const side = next.activeSide;

  while (next[side].battlefield.some((position) => position === null)) {
    const state = next[side];
    const playable = state.hand.find((card) => {
      const definition = getBattleCardDefinition(card.cardId);
      return Math.max(0, definition.cost - state.nextCardDiscount) <= state.command;
    });
    if (!playable) return next;

    const position = state.battlefield.findIndex((unit) => unit === null);
    const result = playCard(next, side, playable.instanceId, position);
    if (!result.ok) return next;
    next = result.battle;
  }

  return next;
}

function attackWithReadyUnits(battle) {
  let next = battle;
  const side = next.activeSide;
  const defendingSide = side === 'player' ? 'enemy' : 'player';

  for (let position = 0; position < next[side].battlefield.length; position += 1) {
    let attacker = next[side].battlefield[position];
    while (attacker?.attacksRemaining > 0 && !next.winner) {
      const targetPosition = chooseTargetPosition(next[defendingSide].battlefield);
      const target = targetPosition === -1
        ? { type: 'commander' }
        : { type: 'unit', position: targetPosition };
      const result = attack(next, side, position, target);
      if (!result.ok) break;
      next = result.battle;
      attacker = next[side].battlefield[position];
    }
  }

  return next;
}

function chooseTargetPosition(battlefield) {
  const tauntPosition = battlefield.findIndex((unit) => unit?.keywords.includes('taunt'));
  if (tauntPosition !== -1) return tauntPosition;
  return battlefield.findIndex(Boolean);
}
