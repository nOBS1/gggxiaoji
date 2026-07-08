import { describe, expect, test } from 'vitest';
import {
  addCard,
  claimSupply,
  createInitialState,
  getOwnedCount,
  getTotalPower,
  openPack,
  synthesizeCard
} from '../src/js/cardGameCore.js';

describe('card game core', () => {
  test('starts with six card packs and no owned cards', () => {
    const state = createInitialState();

    expect(state.packTickets).toBe(6);
    expect(getOwnedCount(state)).toBe(0);
  });

  test('opening a pack consumes a ticket and adds five cards', () => {
    const state = createInitialState();
    const result = openPack(state, () => 0.1);

    expect(result.ok).toBe(true);
    expect(result.cards).toHaveLength(5);
    expect(state.packTickets).toBe(5);
    expect(state.packsOpened).toBe(1);
    expect(getOwnedCount(state)).toBeGreaterThan(0);
  });

  test('duplicate cards can be synthesized into stars', () => {
    const state = createInitialState();

    addCard(state, 'liu-bei');
    addCard(state, 'liu-bei');
    addCard(state, 'liu-bei');
    addCard(state, 'liu-bei');

    const result = synthesizeCard(state, 'liu-bei');

    expect(result.ok).toBe(true);
    expect(state.collection['liu-bei'].star).toBe(2);
    expect(state.collection['liu-bei'].copies).toBe(0);
  });

  test('cannot synthesize without enough duplicates', () => {
    const state = createInitialState();
    addCard(state, 'cao-cao');

    expect(synthesizeCard(state, 'cao-cao')).toEqual({ ok: false, reason: 'NEED_COPIES' });
  });

  test('claim supply adds card packs', () => {
    const state = createInitialState();

    expect(claimSupply(state)).toBe(9);
    expect(getTotalPower(state)).toBe(0);
  });
});
