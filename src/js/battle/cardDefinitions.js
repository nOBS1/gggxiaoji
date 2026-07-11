export const SKILLS = Object.freeze({
  BENEVOLENT_COMMAND: 'benevolent-command',
  WARRIOR_SAINT: 'warrior-saint',
  ROARING_GUARD: 'roaring-guard',
  CUNNING_PLAN: 'cunning-plan',
  RISING_AMBITION: 'rising-ambition',
  BALANCED_COMMAND: 'balanced-command'
});

export const BATTLE_CARDS = [
  {
    id: 'liu-bei',
    name: '刘备',
    faction: '蜀',
    rarity: 'SR',
    role: '统帅',
    cost: 4,
    attack: 3,
    health: 6,
    skill: SKILLS.BENEVOLENT_COMMAND,
    skillName: '仁德号令',
    skillText: '登场：为主将恢复 3 点生命，并使其他友军获得 +1 最大生命。'
  },
  {
    id: 'guan-yu',
    name: '关羽',
    faction: '蜀',
    rarity: 'SSR',
    role: '猛将',
    cost: 6,
    attack: 7,
    health: 6,
    skill: SKILLS.WARRIOR_SAINT,
    skillName: '武圣追击',
    skillText: '突袭。击败武将后，本回合可额外攻击一次，每回合限一次。',
    keywords: ['rush']
  },
  {
    id: 'zhang-fei',
    name: '张飞',
    faction: '蜀',
    rarity: 'SR',
    role: '先锋',
    cost: 5,
    attack: 4,
    health: 8,
    skill: SKILLS.ROARING_GUARD,
    skillName: '燕人怒吼',
    skillText: '嘲讽。每次受到伤害后若仍存活，获得 +1 攻击。',
    keywords: ['taunt']
  },
  {
    id: 'zhuge-liang',
    name: '诸葛亮',
    faction: '蜀',
    rarity: 'SSR',
    role: '谋士',
    cost: 5,
    attack: 2,
    health: 5,
    skill: SKILLS.CUNNING_PLAN,
    skillName: '卧龙妙计',
    skillText: '登场：抽 1 张牌，下一张武将卡的军令消耗减少 1。'
  },
  {
    id: 'cao-cao',
    name: '曹操',
    faction: '魏',
    rarity: 'SSR',
    role: '统帅',
    cost: 6,
    attack: 5,
    health: 7,
    skill: SKILLS.RISING_AMBITION,
    skillName: '雄图渐起',
    skillText: '每有一名其他友军阵亡，本回合获得 +1 攻击和 +1 最大生命。'
  },
  {
    id: 'sun-quan',
    name: '孙权',
    faction: '吴',
    rarity: 'SR',
    role: '统帅',
    cost: 4,
    attack: 3,
    health: 5,
    skill: SKILLS.BALANCED_COMMAND,
    skillName: '江东合势',
    skillText: '登场：若己方有三种不同定位，使所有友军获得 +1/+1。'
  }
];

const CARDS_BY_ID = new Map(BATTLE_CARDS.map((card) => [card.id, card]));

export function getBattleCardDefinition(cardId) {
  return CARDS_BY_ID.get(cardId);
}
