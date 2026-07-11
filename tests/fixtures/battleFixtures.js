export const STANDARD_DECK = [
  'liu-bei',
  'liu-bei',
  'guan-yu',
  'guan-yu',
  'zhang-fei',
  'zhang-fei',
  'zhuge-liang',
  'zhuge-liang',
  'cao-cao',
  'cao-cao',
  'sun-quan',
  'sun-quan'
];

export function deckStartingWith(...cardIds) {
  const remaining = [...STANDARD_DECK];
  for (const cardId of cardIds) {
    const index = remaining.indexOf(cardId);
    if (index === -1) throw new Error(`Cannot place unavailable card first: ${cardId}`);
    remaining.splice(index, 1);
  }
  return [...cardIds, ...remaining];
}
