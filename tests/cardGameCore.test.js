import { describe, expect, test } from 'vitest';
import {
  addCard,
  claimSupply,
  createInitialState,
  getSupplyStatus,
  getOwnedCount,
  getTotalPower,
  normalizeState,
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

  test('supply can be claimed only once every 24 hours', () => {
    const state = createInitialState();
    const claimedAt = Date.UTC(2026, 6, 11, 8, 0, 0);

    expect(claimSupply(state, claimedAt)).toMatchObject({ ok: true, total: 9 });
    expect(claimSupply(state, claimedAt + 23 * 60 * 60 * 1000)).toMatchObject({
      ok: false,
      reason: 'COOLDOWN',
      remainingMs: 60 * 60 * 1000
    });
    expect(getSupplyStatus(state, claimedAt + 24 * 60 * 60 * 1000).available).toBe(true);
    expect(claimSupply(state, claimedAt + 24 * 60 * 60 * 1000)).toMatchObject({
      ok: true,
      total: 12
    });
    expect(getTotalPower(state)).toBe(0);
  });

  test('old saves without a supply timestamp remain eligible', () => {
    const state = normalizeState({ version: 1, packTickets: 2, collection: {} });

    expect(state.lastSupplyClaimAt).toBeNull();
    expect(getSupplyStatus(state, Date.UTC(2026, 6, 11)).available).toBe(true);
  });
});
