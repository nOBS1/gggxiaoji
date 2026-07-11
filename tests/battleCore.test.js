import { describe, expect, test } from 'vitest';
import {
  attack,
  createBattle,
  drawCard,
  endTurn,
  playCard,
  startBattle
} from '../src/js/battle/battleCore.js';
import { STANDARD_DECK, deckStartingWith } from './fixtures/battleFixtures.js';

const ZHUGE_FIRST_DECK = deckStartingWith('zhuge-liang');
const GUAN_FIRST_DECK = deckStartingWith('guan-yu');
const ZHANG_FIRST_DECK = deckStartingWith('zhang-fei');
const CAO_SUPPORT_DECK = deckStartingWith('liu-bei', 'cao-cao');
const FORMATION_DECK = deckStartingWith('zhang-fei', 'zhuge-liang', 'sun-quan', 'liu-bei');

describe('battle core', () => {
  test('rejects a battle deck with more than two copies of a card', () => {
    expect(() =>
      createBattle({
        playerDeck: Array(12).fill('liu-bei'),
        enemyDeck: STANDARD_DECK,
        shuffle: false
      })
    ).toThrow('player deck cannot contain more than 2 copies of liu-bei');
  });

  test('starts a battle with opening draws and the player turn ready', () => {
    const battle = createStartedBattle();

    expect(battle.activeSide).toBe('player');
    expect(battle.round).toBe(1);
    expect(battle.player.commanderHealth).toBe(30);
    expect(battle.enemy.commanderHealth).toBe(30);
    expect(battle.player.hand).toHaveLength(5);
    expect(battle.player.deck).toHaveLength(7);
    expect(battle.player.maxCommand).toBe(3);
    expect(battle.player.command).toBe(3);
  });

  test('starts later turns with more command and can deploy a card to an empty position', () => {
    let battle = createStartedBattle();
    battle = advanceTurns(battle, 2);
    const card = battle.player.hand[0];

    const result = playCard(battle, 'player', card.instanceId, 1);
    battle = result.battle;

    expect(battle.round).toBe(2);
    expect(battle.player.maxCommand).toBe(4);
    expect(result).toMatchObject({ ok: true, instanceId: card.instanceId, position: 1 });
    expect(battle.player.command).toBe(0);
    expect(battle.player.hand).toHaveLength(5);
    expect(battle.player.battlefield[1]).toMatchObject({
      cardId: 'liu-bei',
      attack: 3,
      health: 6,
      attacksRemaining: 0
    });
  });

  test('Zhuge Liang draws a card and discounts the next deployment', () => {
    let battle = createStartedBattle(ZHUGE_FIRST_DECK);
    battle = advanceTurns(battle, 4);
    const zhugeLiang = battle.player.hand.find((card) => card.cardId === 'zhuge-liang');
    const handSizeBefore = battle.player.hand.length;

    battle = deploy(battle, 'player', zhugeLiang.instanceId, 0);

    expect(battle.player.hand).toHaveLength(handSizeBefore);
    expect(battle.player.nextCardDiscount).toBe(1);
  });

  test('units trade damage and can attack only once per turn', () => {
    let battle = createStartedBattle();
    battle = advanceTurns(battle, 2);
    battle = deploy(battle, 'player', battle.player.hand[0].instanceId, 0);
    battle = advanceTurns(battle, 1);
    battle = deploy(battle, 'enemy', battle.enemy.hand[0].instanceId, 0);
    battle = advanceTurns(battle, 1);

    const result = attack(battle, 'player', 0, { type: 'unit', position: 0 });
    battle = result.battle;

    expect(result).toMatchObject({ ok: true, damageToAttacker: 3, damageToTarget: 3 });
    expect(battle.player.battlefield[0].health).toBe(3);
    expect(battle.enemy.battlefield[0].health).toBe(3);
    expect(attack(battle, 'player', 0, { type: 'unit', position: 0 })).toMatchObject({
      ok: false,
      reason: 'NO_ATTACKS_REMAINING'
    });
  });

  test('attacking an empty battlefield damages the commander and ends the battle', () => {
    let battle = createStartedBattle(GUAN_FIRST_DECK);
    battle = advanceTurns(battle, 6);
    const guanYu = battle.player.hand.find((card) => card.cardId === 'guan-yu');
    battle = deploy(battle, 'player', guanYu.instanceId, 0);

    for (let strike = 0; strike < 5; strike += 1) {
      battle = advanceTurns(battle, 2);
      battle = attack(battle, 'player', 0, { type: 'commander' }).battle;
    }

    expect(battle.enemy.commanderHealth).toBe(0);
    expect(battle.winner).toBe('player');
    expect(endTurn(battle)).toMatchObject({ ok: false, reason: 'BATTLE_OVER' });
  });

  test('a unit with rush can attack on the turn it is deployed', () => {
    let battle = createStartedBattle(GUAN_FIRST_DECK);
    battle = advanceTurns(battle, 6);
    const guanYu = battle.player.hand.find((card) => card.cardId === 'guan-yu');
    battle = deploy(battle, 'player', guanYu.instanceId, 0);

    const result = attack(battle, 'player', 0, { type: 'commander' });

    expect(result.ok).toBe(true);
    expect(result.battle.enemy.commanderHealth).toBe(23);
  });

  test('defeated units enter the discard pile and Guan Yu can attack again once', () => {
    let battle = createStartedBattle(GUAN_FIRST_DECK);
    battle = advanceTurns(battle, 6);
    const guanYu = battle.player.hand.find((card) => card.cardId === 'guan-yu');
    battle = deploy(battle, 'player', guanYu.instanceId, 0);
    battle = advanceTurns(battle, 1);
    const liuBei = battle.enemy.hand.find((card) => card.cardId === 'liu-bei');
    battle = deploy(battle, 'enemy', liuBei.instanceId, 0);
    battle = advanceTurns(battle, 1);

    battle = attack(battle, 'player', 0, { type: 'unit', position: 0 }).battle;

    expect(battle.enemy.battlefield[0]).toBeNull();
    expect(battle.enemy.discard).toHaveLength(1);
    expect(battle.enemy.discard[0].cardId).toBe('liu-bei');
    expect(battle.player.battlefield[0].health).toBe(3);
    expect(battle.player.battlefield[0].attacksRemaining).toBe(1);
  });

  test('Zhang Fei gains attack after surviving damage', () => {
    let battle = createStartedBattle(STANDARD_DECK, ZHANG_FIRST_DECK);
    battle = advanceTurns(battle, 2);
    battle = deploy(battle, 'player', battle.player.hand[0].instanceId, 0);
    battle = advanceTurns(battle, 3);
    const zhangFei = battle.enemy.hand.find((card) => card.cardId === 'zhang-fei');
    battle = deploy(battle, 'enemy', zhangFei.instanceId, 0);
    battle = advanceTurns(battle, 1);

    battle = attack(battle, 'player', 0, { type: 'unit', position: 0 }).battle;

    expect(battle.enemy.battlefield[0]).toMatchObject({
      cardId: 'zhang-fei',
      attack: 5,
      health: 5
    });
  });

  test('drawing from an empty deck deals increasing fatigue damage', () => {
    let battle = createStartedBattle();
    for (let index = 0; index < 7; index += 1) battle = drawCard(battle, 'player').battle;

    let result = drawCard(battle, 'player');
    battle = result.battle;
    expect(result).toMatchObject({ ok: false, reason: 'FATIGUE', damage: 1 });

    result = drawCard(battle, 'player');
    battle = result.battle;
    expect(result).toMatchObject({ ok: false, reason: 'FATIGUE', damage: 2 });
    expect(battle.player.commanderHealth).toBe(27);
  });

  test('Liu Bei strengthens allies when deployed', () => {
    let battle = createStartedBattle();
    battle = advanceTurns(battle, 2);
    battle = deploy(battle, 'player', battle.player.hand[0].instanceId, 0);
    battle = advanceTurns(battle, 2);
    const secondLiuBei = battle.player.hand.find((card) => card.cardId === 'liu-bei');
    battle = deploy(battle, 'player', secondLiuBei.instanceId, 1);

    expect(battle.player.battlefield[0]).toMatchObject({ health: 7, maxHealth: 7 });
    expect(battle.player.battlefield[1]).toMatchObject({ health: 6, maxHealth: 6 });
  });

  test('Cao Cao grows when a friendly unit is defeated', () => {
    let battle = createStartedBattle(GUAN_FIRST_DECK, CAO_SUPPORT_DECK);
    battle = advanceTurns(battle, 3);
    battle = deploy(battle, 'enemy', battle.enemy.hand[0].instanceId, 0);
    battle = advanceTurns(battle, 3);
    const guanYu = battle.player.hand.find((card) => card.cardId === 'guan-yu');
    battle = deploy(battle, 'player', guanYu.instanceId, 0);
    battle = advanceTurns(battle, 1);
    const caoCao = battle.enemy.hand.find((card) => card.cardId === 'cao-cao');
    battle = deploy(battle, 'enemy', caoCao.instanceId, 1);
    battle = advanceTurns(battle, 1);

    battle = attack(battle, 'player', 0, { type: 'unit', position: 0 }).battle;

    expect(battle.enemy.battlefield[1]).toMatchObject({
      cardId: 'cao-cao',
      attack: 6,
      health: 8,
      maxHealth: 8
    });

    battle = endTurn(battle).battle;
    expect(battle.enemy.battlefield[1]).toMatchObject({
      attack: 5,
      health: 7,
      maxHealth: 7
    });
  });

  test('Sun Quan strengthens a formation with three different roles', () => {
    let battle = createStartedBattle(FORMATION_DECK);
    battle = advanceTurns(battle, 4);
    const zhangFei = battle.player.hand.find((card) => card.cardId === 'zhang-fei');
    battle = deploy(battle, 'player', zhangFei.instanceId, 0);
    battle = advanceTurns(battle, 2);
    const zhugeLiang = battle.player.hand.find((card) => card.cardId === 'zhuge-liang');
    battle = deploy(battle, 'player', zhugeLiang.instanceId, 1);
    battle = advanceTurns(battle, 2);
    const sunQuan = battle.player.hand.find((card) => card.cardId === 'sun-quan');
    battle = deploy(battle, 'player', sunQuan.instanceId, 2);

    expect(battle.player.battlefield[0]).toMatchObject({ attack: 5, health: 9 });
    expect(battle.player.battlefield[1]).toMatchObject({ attack: 3, health: 6 });
    expect(battle.player.battlefield[2]).toMatchObject({ attack: 4, health: 6 });
  });

  test('taunt units must be attacked before other units', () => {
    let battle = createStartedBattle(GUAN_FIRST_DECK, FORMATION_DECK);
    battle = advanceTurns(battle, 3);
    const liuBei = battle.enemy.hand.find((card) => card.cardId === 'liu-bei');
    battle = deploy(battle, 'enemy', liuBei.instanceId, 0);
    battle = advanceTurns(battle, 2);
    const zhangFei = battle.enemy.hand.find((card) => card.cardId === 'zhang-fei');
    battle = deploy(battle, 'enemy', zhangFei.instanceId, 1);
    battle = advanceTurns(battle, 1);
    const guanYu = battle.player.hand.find((card) => card.cardId === 'guan-yu');
    battle = deploy(battle, 'player', guanYu.instanceId, 0);
    battle = advanceTurns(battle, 2);

    expect(attack(battle, 'player', 0, { type: 'unit', position: 0 })).toMatchObject({
      ok: false,
      reason: 'TAUNT_PRESENT'
    });
    expect(attack(battle, 'player', 0, { type: 'unit', position: 1 }).ok).toBe(true);
  });
});

function createStartedBattle(playerDeck = STANDARD_DECK, enemyDeck = STANDARD_DECK) {
  const opening = createBattle({ playerDeck, enemyDeck, shuffle: false });
  return startBattle(opening).battle;
}

function advanceTurns(battle, count) {
  let next = battle;
  for (let index = 0; index < count; index += 1) next = endTurn(next).battle;
  return next;
}

function deploy(battle, side, instanceId, position) {
  const result = playCard(battle, side, instanceId, position);
  expect(result.ok).toBe(true);
  return result.battle;
}
