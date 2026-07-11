import { getBattleCardDefinition } from './cardDefinitions.js';
import {
  applyDeploySkill,
  applyFriendlyDefeatedSkill,
  applyKillSkill,
  applySurvivingDamageSkill,
  applyTurnEndSkill
} from './skillEffects.js';

const SIDES = ['player', 'enemy'];
const OPENING_HAND_SIZE = 4;
const DECK_SIZE = 12;
const MAX_CARD_COPIES = 2;
const STARTING_COMMAND = 3;
const MAX_COMMAND = 10;
const COMMANDER_MAX_HEALTH = 30;

export function createBattle({ playerDeck, enemyDeck, shuffle = true, random = Math.random }) {
  validateDeck(playerDeck, 'player');
  validateDeck(enemyDeck, 'enemy');

  const battle = {
    phase: 'opening',
    activeSide: null,
    round: 0,
    turn: 0,
    winner: null,
    nextInstanceId: 1,
    player: createSide(prepareDeck(playerDeck, shuffle, random)),
    enemy: createSide(prepareDeck(enemyDeck, shuffle, random))
  };

  for (const side of SIDES) {
    for (let index = 0; index < OPENING_HAND_SIZE; index += 1) {
      drawCardFromDeck(battle, side);
    }
  }

  return battle;
}

export function mulliganOpeningHand(battle, side) {
  if (battle.phase !== 'opening') return failure(battle, 'NOT_OPENING_PHASE');
  if (!SIDES.includes(side)) return failure(battle, 'INVALID_SIDE');
  if (battle[side].mulliganUsed) return failure(battle, 'MULLIGAN_ALREADY_USED');

  const next = cloneBattle(battle);
  const returnedCards = next[side].hand.map((card) => card.cardId);
  next[side].hand = [];
  next[side].deck.push(...returnedCards);
  for (let index = 0; index < OPENING_HAND_SIZE; index += 1) {
    drawCardFromDeck(next, side);
  }
  next[side].mulliganUsed = true;
  return success(next);
}

export function startBattle(battle) {
  if (battle.phase !== 'opening') return failure(battle, 'BATTLE_ALREADY_STARTED');

  const next = cloneBattle(battle);
  next.phase = 'battle';
  next.activeSide = 'player';
  next.round = 1;
  next.turn = 1;
  beginTurn(next, 'player');
  return success(next, { activeSide: 'player' });
}

export function endTurn(battle) {
  if (battle.phase !== 'battle') return failure(battle, 'BATTLE_NOT_STARTED');
  if (battle.winner) return failure(battle, 'BATTLE_OVER');

  const next = cloneBattle(battle);
  expireTemporaryEffects(next);
  const nextSide = otherSide(next.activeSide);
  next.activeSide = nextSide;
  next.turn += 1;
  if (nextSide === 'player') next.round += 1;
  beginTurn(next, nextSide);
  return success(next, { activeSide: nextSide });
}

export function playCard(battle, side, instanceId, position) {
  if (battle.phase !== 'battle') return failure(battle, 'BATTLE_NOT_STARTED');
  if (battle.winner) return failure(battle, 'BATTLE_OVER');
  if (battle.activeSide !== side) return failure(battle, 'NOT_ACTIVE_SIDE');
  if (!Number.isInteger(position) || position < 0 || position >= battle[side].battlefield.length) {
    return failure(battle, 'INVALID_POSITION');
  }
  if (battle[side].battlefield[position]) return failure(battle, 'POSITION_OCCUPIED');

  const handIndex = battle[side].hand.findIndex((card) => card.instanceId === instanceId);
  if (handIndex === -1) return failure(battle, 'CARD_NOT_IN_HAND');

  const card = battle[side].hand[handIndex];
  const definition = getBattleCardDefinition(card.cardId);
  const cost = Math.max(0, definition.cost - battle[side].nextCardDiscount);
  if (battle[side].command < cost) return failure(battle, 'NOT_ENOUGH_COMMAND');

  const next = cloneBattle(battle);
  const nextCard = next[side].hand[handIndex];
  next[side].command -= cost;
  next[side].nextCardDiscount = 0;
  next[side].hand.splice(handIndex, 1);
  next[side].battlefield[position] = createUnit(nextCard, definition);
  applyDeploySkill({
    battle: next,
    side,
    position,
    commanderMaxHealth: COMMANDER_MAX_HEALTH,
    drawCard: () => drawCardMutable(next, side)
  });

  return success(next, { instanceId, position });
}

export function drawCard(battle, side) {
  if (battle.phase !== 'battle') return failure(battle, 'BATTLE_NOT_STARTED');
  if (battle.winner) return failure(battle, 'BATTLE_OVER');
  if (!SIDES.includes(side)) return failure(battle, 'INVALID_SIDE');

  const next = cloneBattle(battle);
  const result = drawCardMutable(next, side);
  return { ...result, battle: next };
}

export function attack(battle, side, attackerPosition, target) {
  const validation = validateAttack(battle, side, attackerPosition, target);
  if (validation) return failure(battle, validation);

  const next = cloneBattle(battle);
  const attacker = next[side].battlefield[attackerPosition];
  const defendingSide = otherSide(side);

  if (target.type === 'commander') {
    attacker.attacksRemaining -= 1;
    next[defendingSide].commanderHealth = Math.max(
      0,
      next[defendingSide].commanderHealth - attacker.attack
    );
    updateWinner(next);
    return success(next, { damageToCommander: attacker.attack });
  }

  const defender = next[defendingSide].battlefield[target.position];
  const damageToAttacker = defender.attack;
  const damageToTarget = attacker.attack;
  attacker.attacksRemaining -= 1;
  attacker.health -= damageToAttacker;
  defender.health -= damageToTarget;
  const defeatedTarget = defender.health <= 0;

  applySurvivingDamageSkill(attacker, damageToAttacker);
  applySurvivingDamageSkill(defender, damageToTarget);
  resolveDeaths(next);

  if (defeatedTarget && attacker.health > 0) applyKillSkill(attacker, next.turn);
  return success(next, { damageToAttacker, damageToTarget });
}

function createSide(deck) {
  return {
    commanderHealth: COMMANDER_MAX_HEALTH,
    deck,
    hand: [],
    battlefield: [null, null, null],
    discard: [],
    maxCommand: 0,
    command: 0,
    fatigue: 0,
    turnsStarted: 0,
    nextCardDiscount: 0,
    mulliganUsed: false
  };
}

function beginTurn(battle, side) {
  const state = battle[side];
  state.turnsStarted += 1;
  state.maxCommand = state.turnsStarted === 1
    ? STARTING_COMMAND
    : Math.min(MAX_COMMAND, state.maxCommand + 1);
  state.command = state.maxCommand;

  for (const unit of state.battlefield) {
    if (unit) unit.attacksRemaining = 1;
  }

  drawCardMutable(battle, side);
}

function drawCardMutable(battle, side) {
  const state = battle[side];
  if (state.deck.length === 0) {
    state.fatigue += 1;
    state.commanderHealth = Math.max(0, state.commanderHealth - state.fatigue);
    updateWinner(battle);
    return { ok: false, reason: 'FATIGUE', damage: state.fatigue };
  }

  const card = drawCardFromDeck(battle, side);
  return { ok: true, card };
}

function drawCardFromDeck(battle, side) {
  const cardId = battle[side].deck.shift();
  const card = createCardInstance(battle, cardId);
  battle[side].hand.push(card);
  return card;
}

function createCardInstance(battle, cardId) {
  const definition = getBattleCardDefinition(cardId);
  const instance = {
    instanceId: `card-${battle.nextInstanceId}`,
    cardId: definition.id
  };
  battle.nextInstanceId += 1;
  return instance;
}

function createUnit(card, definition) {
  const keywords = [...(definition.keywords || [])];
  return {
    ...card,
    name: definition.name,
    faction: definition.faction,
    rarity: definition.rarity,
    role: definition.role,
    attack: definition.attack,
    health: definition.health,
    maxHealth: definition.health,
    skill: definition.skill,
    keywords,
    attacksRemaining: keywords.includes('rush') ? 1 : 0,
    skillState: {}
  };
}

function validateAttack(battle, side, attackerPosition, target) {
  if (battle.phase !== 'battle') return 'BATTLE_NOT_STARTED';
  if (battle.winner) return 'BATTLE_OVER';
  if (battle.activeSide !== side) return 'NOT_ACTIVE_SIDE';

  const attacker = battle[side].battlefield[attackerPosition];
  if (!attacker) return 'NO_ATTACKER';
  if (attacker.attacksRemaining <= 0) return 'NO_ATTACKS_REMAINING';

  const defendingSide = otherSide(side);
  if (target?.type === 'commander') {
    return battle[defendingSide].battlefield.some(Boolean) ? 'COMMANDER_GUARDED' : null;
  }
  if (target?.type !== 'unit') return 'INVALID_TARGET';

  const defender = battle[defendingSide].battlefield[target.position];
  if (!defender) return 'NO_TARGET';
  const tauntPresent = battle[defendingSide].battlefield.some((unit) =>
    unit?.keywords.includes('taunt')
  );
  return tauntPresent && !defender.keywords.includes('taunt') ? 'TAUNT_PRESENT' : null;
}

function resolveDeaths(battle) {
  for (const side of SIDES) {
    const state = battle[side];
    let defeatedCount = 0;
    for (let position = 0; position < state.battlefield.length; position += 1) {
      const unit = state.battlefield[position];
      if (!unit || unit.health > 0) continue;
      state.discard.push(unit);
      state.battlefield[position] = null;
      defeatedCount += 1;
    }

    if (defeatedCount > 0) {
      for (const survivor of state.battlefield) {
        if (survivor) applyFriendlyDefeatedSkill(survivor, defeatedCount);
      }
    }
  }
}

function expireTemporaryEffects(battle) {
  for (const side of SIDES) {
    for (const unit of battle[side].battlefield) {
      if (unit) applyTurnEndSkill(unit);
    }
  }
}

function prepareDeck(cardIds, shouldShuffle, random) {
  const deck = [...cardIds];
  if (!shouldShuffle) return deck;

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [deck[index], deck[target]] = [deck[target], deck[index]];
  }
  return deck;
}

function validateDeck(cardIds, side) {
  if (!Array.isArray(cardIds) || cardIds.length !== DECK_SIZE) {
    throw new Error(`${side} deck must contain ${DECK_SIZE} cards`);
  }

  const copies = new Map();
  for (const cardId of cardIds) {
    if (!getBattleCardDefinition(cardId)) {
      throw new Error(`${side} deck contains unknown card: ${cardId}`);
    }
    const copyCount = (copies.get(cardId) || 0) + 1;
    if (copyCount > MAX_CARD_COPIES) {
      throw new Error(`${side} deck cannot contain more than ${MAX_CARD_COPIES} copies of ${cardId}`);
    }
    copies.set(cardId, copyCount);
  }
}

function updateWinner(battle) {
  if (battle.player.commanderHealth <= 0) battle.winner = 'enemy';
  if (battle.enemy.commanderHealth <= 0) battle.winner = 'player';
}

function otherSide(side) {
  return side === 'player' ? 'enemy' : 'player';
}

function cloneBattle(battle) {
  return structuredClone(battle);
}

function success(battle, details = {}) {
  return { ok: true, battle, ...details };
}

function failure(battle, reason) {
  return { ok: false, reason, battle };
}
