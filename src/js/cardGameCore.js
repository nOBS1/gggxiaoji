export const CARD_SHEET = '/cards/three-kingdoms-card-sheet.png';

export const CARDS = [
  {
    id: 'liu-bei',
    name: '刘备',
    title: '仁德君主',
    faction: '蜀',
    rarity: 'SR',
    role: '统御',
    basePower: 98,
    quote: '以仁聚众，越战越稳。',
    sheet: { col: 0, row: 0 }
  },
  {
    id: 'guan-yu',
    name: '关羽',
    title: '武圣横刀',
    faction: '蜀',
    rarity: 'SSR',
    role: '斩将',
    basePower: 132,
    quote: '高星后爆发最高。',
    sheet: { col: 1, row: 0 }
  },
  {
    id: 'zhang-fei',
    name: '张飞',
    title: '燕人猛将',
    faction: '蜀',
    rarity: 'SR',
    role: '破阵',
    basePower: 112,
    quote: '前期合成收益很高。',
    sheet: { col: 2, row: 0 }
  },
  {
    id: 'zhuge-liang',
    name: '诸葛亮',
    title: '卧龙军师',
    faction: '蜀',
    rarity: 'SSR',
    role: '谋略',
    basePower: 128,
    quote: '每升星提升全局评分。',
    sheet: { col: 0, row: 1 }
  },
  {
    id: 'cao-cao',
    name: '曹操',
    title: '魏武枭雄',
    faction: '魏',
    rarity: 'SSR',
    role: '霸业',
    basePower: 136,
    quote: '单卡战力最强。',
    sheet: { col: 1, row: 1 }
  },
  {
    id: 'sun-quan',
    name: '孙权',
    title: '江东少主',
    faction: '吴',
    rarity: 'SR',
    role: '守成',
    basePower: 104,
    quote: '稳定补强卡组。',
    sheet: { col: 2, row: 1 }
  }
];

export const RARITY_META = {
  SR: { label: '史诗', weight: 68, dust: 12 },
  SSR: { label: '传说', weight: 32, dust: 28 }
};

const STORAGE_VERSION = 2;
const PACK_SIZE = 5;
const SYNTH_COST = 3;
const MAX_STAR = 5;
const SUPPLY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function createInitialState() {
  return {
    version: STORAGE_VERSION,
    packTickets: 6,
    packsOpened: 0,
    lastSupplyClaimAt: null,
    lastPulls: [],
    collection: Object.fromEntries(
      CARDS.map((card) => [card.id, { owned: false, copies: 0, star: 0 }])
    )
  };
}

export function normalizeState(value) {
  const state = createInitialState();
  if (!value || typeof value !== 'object') return state;

  state.packTickets = clampNumber(value.packTickets, 0, 999);
  state.packsOpened = clampNumber(value.packsOpened, 0, 99999);
  state.lastSupplyClaimAt = normalizeTimestamp(value.lastSupplyClaimAt);
  state.lastPulls = Array.isArray(value.lastPulls)
    ? value.lastPulls.filter((id) => CARDS.some((card) => card.id === id)).slice(0, PACK_SIZE)
    : [];

  for (const card of CARDS) {
    const entry = value.collection?.[card.id];
    if (!entry || typeof entry !== 'object') continue;
    const star = clampNumber(entry.star, 0, MAX_STAR);
    state.collection[card.id] = {
      owned: Boolean(entry.owned) || star > 0,
      copies: clampNumber(entry.copies, 0, 999),
      star
    };
  }

  return state;
}

export function openPack(state, random = Math.random) {
  if (state.packTickets <= 0) {
    return { ok: false, reason: 'NO_TICKETS', cards: [] };
  }

  const pulled = [];
  state.packTickets -= 1;
  state.packsOpened += 1;

  for (let i = 0; i < PACK_SIZE; i++) {
    const card = drawCard(random);
    addCard(state, card.id);
    pulled.push(card.id);
  }

  state.lastPulls = pulled;
  return { ok: true, cards: pulled };
}

export function addCard(state, cardId) {
  const entry = state.collection[cardId];
  if (!entry) return;

  if (!entry.owned) {
    entry.owned = true;
    entry.star = 1;
    entry.copies = 0;
    return;
  }

  entry.copies += 1;
}

export function synthesizeCard(state, cardId) {
  const entry = state.collection[cardId];
  if (!entry || !entry.owned) {
    return { ok: false, reason: 'NOT_OWNED' };
  }
  if (entry.star >= MAX_STAR) {
    return { ok: false, reason: 'MAX_STAR' };
  }
  if (entry.copies < SYNTH_COST) {
    return { ok: false, reason: 'NEED_COPIES' };
  }

  entry.copies -= SYNTH_COST;
  entry.star += 1;
  return { ok: true };
}

export function synthesizeAll(state) {
  let upgraded = 0;
  let changed = true;

  while (changed) {
    changed = false;
    for (const card of CARDS) {
      const result = synthesizeCard(state, card.id);
      if (result.ok) {
        upgraded += 1;
        changed = true;
      }
    }
  }

  return upgraded;
}

export function claimSupply(state, now = Date.now()) {
  const status = getSupplyStatus(state, now);
  if (!status.available) {
    return {
      ok: false,
      reason: 'COOLDOWN',
      nextClaimAt: status.nextClaimAt,
      remainingMs: status.remainingMs
    };
  }

  state.packTickets += 3;
  state.lastSupplyClaimAt = now;
  return {
    ok: true,
    total: state.packTickets,
    nextClaimAt: now + SUPPLY_COOLDOWN_MS
  };
}

export function getSupplyStatus(state, now = Date.now()) {
  const lastClaimAt = normalizeTimestamp(state.lastSupplyClaimAt);
  if (lastClaimAt === null) {
    return { available: true, nextClaimAt: null, remainingMs: 0 };
  }

  const nextClaimAt = lastClaimAt + SUPPLY_COOLDOWN_MS;
  const remainingMs = Math.min(SUPPLY_COOLDOWN_MS, Math.max(0, nextClaimAt - now));
  return {
    available: remainingMs === 0,
    nextClaimAt,
    remainingMs
  };
}

export function getCardPower(card, entry) {
  if (!entry?.owned) return 0;
  const rarityBonus = card.rarity === 'SSR' ? 1.22 : 1;
  return Math.round(card.basePower * entry.star * rarityBonus + entry.copies * 4);
}

export function getTotalPower(state) {
  return CARDS.reduce((sum, card) => sum + getCardPower(card, state.collection[card.id]), 0);
}

export function getOwnedCount(state) {
  return CARDS.filter((card) => state.collection[card.id]?.owned).length;
}

export function getSynthCost() {
  return SYNTH_COST;
}

export function getMaxStar() {
  return MAX_STAR;
}

export function getCardById(cardId) {
  return CARDS.find((card) => card.id === cardId);
}

function drawCard(random) {
  const rarity = pickRarity(random);
  const candidates = CARDS.filter((card) => card.rarity === rarity);
  return candidates[Math.floor(random() * candidates.length)] || candidates[0];
}

function pickRarity(random) {
  const total = Object.values(RARITY_META).reduce((sum, meta) => sum + meta.weight, 0);
  let roll = random() * total;

  for (const [rarity, meta] of Object.entries(RARITY_META)) {
    roll -= meta.weight;
    if (roll <= 0) return rarity;
  }

  return 'SR';
}

function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function normalizeTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}
