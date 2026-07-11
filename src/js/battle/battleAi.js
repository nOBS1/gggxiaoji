import {
  attack,
  endTurn,
  getLegalAttackTargets,
  getPlayableHandCards,
  playCard
} from './battleCore.js';

export function runAiStep(battle) {
  const invalidReason = validateAiTurn(battle);
  if (invalidReason) {
    return { ok: false, reason: invalidReason, battle, action: null, done: true };
  }

  const playable = getPlayableHandCards(battle, 'enemy')[0];
  if (playable) {
    const position = battle.enemy.battlefield.findIndex((unit) => unit === null);
    const result = playCard(battle, 'enemy', playable.instanceId, position);
    return {
      ok: result.ok,
      battle: result.battle,
      action: { type: 'deploy', cardId: playable.cardId, position },
      done: Boolean(result.battle.winner)
    };
  }

  for (let position = 0; position < battle.enemy.battlefield.length; position += 1) {
    const unit = battle.enemy.battlefield[position];
    if (!unit?.attacksRemaining) continue;

    const legalTargets = getLegalAttackTargets(battle, 'enemy', position);
    const targetPosition = chooseWeakestTarget(battle, legalTargets.positions);
    const target = targetPosition === -1 && legalTargets.commander
      ? { type: 'commander' }
      : { type: 'unit', position: targetPosition };
    const targetCardId = target.type === 'unit'
      ? battle.player.battlefield[target.position]?.cardId
      : null;
    const result = attack(battle, 'enemy', position, target);
    if (!result.ok) continue;

    return {
      ok: true,
      battle: result.battle,
      action: { type: 'attack', cardId: unit.cardId, target, targetCardId },
      done: Boolean(result.battle.winner)
    };
  }

  const result = endTurn(battle);
  return {
    ok: result.ok,
    battle: result.battle,
    action: { type: 'end-turn' },
    done: true
  };
}

export function runAiTurn(battle) {
  const invalidReason = validateAiTurn(battle);
  if (invalidReason) {
    return { ok: false, reason: invalidReason, battle, actions: [] };
  }

  const actions = [];
  let next = battle;
  for (let stepCount = 0; stepCount < 32; stepCount += 1) {
    const result = runAiStep(next);
    if (!result.ok) return { ...result, actions };
    next = result.battle;
    actions.push(result.action);
    if (result.done) return { ok: true, battle: next, actions };
  }

  return { ok: false, reason: 'AI_STEP_LIMIT', battle: next, actions };
}

function validateAiTurn(battle) {
  if (battle.phase !== 'battle') return 'BATTLE_NOT_STARTED';
  if (battle.winner) return 'BATTLE_OVER';
  if (battle.activeSide !== 'enemy') return 'NOT_AI_TURN';
  return null;
}

function chooseWeakestTarget(battle, positions) {
  let targetPosition = -1;
  let lowestHealth = Number.POSITIVE_INFINITY;
  for (const position of positions) {
    const unit = battle.player.battlefield[position];
    if (unit.health < lowestHealth) {
      lowestHealth = unit.health;
      targetPosition = position;
    }
  }
  return targetPosition;
}
