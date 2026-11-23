// cards.js — ASHDECK's card catalogue. Four houses, each told apart by colour AND
// shape (Ember ▲ red, Stone ■ amber, Gale ● green, Frost ◆ blue). A card's effects
// are data; combat.js interprets them:
//   damage/hits  strike the enemy, `hits` times (player Strength adds to each hit)
//   block        the player gains that much Block
//   draw         draw that many cards        gainEnergy  energy right now
//   burn/vuln/weak  enemy statuses: Burn ticks at its turn, Vulnerable takes +50%,
//                Weak makes its attacks deal 25% less
//   strength     the player gains Strength for the rest of the combat
//   freeze       the enemy's next move does nothing
//   bonusVsBurning  extra damage on the first hit if the enemy is Burning
//   exhaust      the card leaves the combat instead of going to the discard pile

export const HOUSES = {
  ember: { name: 'Ember', glyph: '▲', colour: '#e2483d' },
  stone: { name: 'Stone', glyph: '■', colour: '#d99a3d' },
  gale: { name: 'Gale', glyph: '●', colour: '#35a06f' },
  frost: { name: 'Frost', glyph: '◆', colour: '#4d8fd1' },
};

export const CARDS = {
  // --- The starter deck's cards ---
  strike: {
    name: 'Strike', house: 'ember', cost: 1, type: 'Attack', rarity: 'Starter',
    text: 'Deal <b>6</b> damage.', effects: { damage: 6 },
  },
  guard: {
    name: 'Guard', house: 'stone', cost: 1, type: 'Skill', rarity: 'Starter',
    text: 'Gain <b>6</b> Block.', effects: { block: 6 },
  },
  kindle: {
    name: 'Kindle', house: 'ember', cost: 0, type: 'Skill', rarity: 'Starter',
    text: 'Apply <b>2 Burn</b>. Burn ticks at the start of its turn.', effects: { burn: 2 },
  },

  // --- Ember ▲: damage and fire ---
  flameLash: {
    name: 'Flame Lash', house: 'ember', cost: 1, type: 'Attack', rarity: 'Common',
    text: 'Deal <b>9</b> damage.', effects: { damage: 9 },
  },
  immolate: {
    name: 'Immolate', house: 'ember', cost: 2, type: 'Attack', rarity: 'Common',
    text: 'Deal <b>7</b> damage and apply <b>3 Burn</b>.', effects: { damage: 7, burn: 3 },
  },
  wildfire: {
    name: 'Wildfire', house: 'ember', cost: 2, type: 'Attack', rarity: 'Rare',
    text: 'Deal <b>4</b> damage <b>three times</b>.', effects: { damage: 4, hits: 3 },
  },
  cinderNova: {
    name: 'Cinder Nova', house: 'ember', cost: 3, type: 'Attack', rarity: 'Rare',
    text: 'Deal <b>16</b> damage and apply <b>2 Burn</b>.', effects: { damage: 16, burn: 2 },
  },
  phoenixHeart: {
    name: 'Phoenix Heart', house: 'ember', cost: 1, type: 'Power', rarity: 'Rare',
    text: 'Gain <b>1 Strength</b>. Your attacks deal +1 all combat.', effects: { strength: 1, exhaust: true },
  },

  // --- Stone ■: block and control through weight ---
  bulwark: {
    name: 'Bulwark', house: 'stone', cost: 1, type: 'Skill', rarity: 'Common',
    text: 'Gain <b>9</b> Block.', effects: { block: 9 },
  },
  stonewall: {
    name: 'Stonewall', house: 'stone', cost: 2, type: 'Skill', rarity: 'Common',
    text: 'Gain <b>14</b> Block.', effects: { block: 14 },
  },
  quake: {
    name: 'Quake', house: 'stone', cost: 2, type: 'Attack', rarity: 'Rare',
    text: 'Deal <b>8</b> damage and apply <b>2 Vulnerable</b>.', effects: { damage: 8, vuln: 2 },
  },
  rampart: {
    name: 'Rampart', house: 'stone', cost: 1, type: 'Skill', rarity: 'Common',
    text: 'Gain <b>6</b> Block. Draw <b>1</b> card.', effects: { block: 6, draw: 1 },
  },

  // --- Gale ●: cards and energy ---
  gustDraw: {
    name: 'Gust Draw', house: 'gale', cost: 1, type: 'Skill', rarity: 'Common',
    text: 'Draw <b>2</b> cards.', effects: { draw: 2 },
  },
  tailwind: {
    name: 'Tailwind', house: 'gale', cost: 0, type: 'Skill', rarity: 'Rare',
    text: 'Gain <b>1 Energy</b>. Draw <b>1</b> card.', effects: { gainEnergy: 1, draw: 1 },
  },
  cyclone: {
    name: 'Cyclone', house: 'gale', cost: 2, type: 'Attack', rarity: 'Common',
    text: 'Deal <b>5</b> damage <b>twice</b>.', effects: { damage: 5, hits: 2 },
  },
  zephyr: {
    name: 'Zephyr Jab', house: 'gale', cost: 1, type: 'Attack', rarity: 'Common',
    text: 'Deal <b>3</b> damage. Draw <b>1</b> card.', effects: { damage: 3, draw: 1 },
  },

  // --- Frost ◆: weaken, freeze, and punish the burning ---
  chill: {
    name: 'Chill', house: 'frost', cost: 1, type: 'Attack', rarity: 'Common',
    text: 'Deal <b>3</b> damage and apply <b>2 Weak</b>.', effects: { damage: 3, weak: 2 },
  },
  frostbite: {
    name: 'Frostbite', house: 'frost', cost: 2, type: 'Attack', rarity: 'Rare',
    text: 'Deal <b>8</b> damage. If the enemy is <b>Burning</b>, deal <b>8 more</b>.',
    effects: { damage: 8, bonusVsBurning: 8 },
  },
  avalanche: {
    name: 'Avalanche', house: 'frost', cost: 3, type: 'Attack', rarity: 'Rare',
    text: 'Deal <b>18</b> damage.', effects: { damage: 18 },
  },
  deepFreeze: {
    name: 'Deep Freeze', house: 'frost', cost: 2, type: 'Skill', rarity: 'Epic',
    text: '<b>Freeze</b> the enemy: its next move does nothing. Apply <b>1 Vulnerable</b>.',
    effects: { freeze: true, vuln: 1 },
  },
};

/** The ten cards every run starts with. */
export const STARTER_DECK = [
  'strike', 'strike', 'strike', 'strike', 'strike',
  'guard', 'guard', 'guard', 'guard',
  'kindle',
];

/** Cards that can appear in a post-floor draft, with their draft weights. */
export const DRAFT_POOL = [
  ['flameLash', 10], ['bulwark', 10], ['gustDraw', 9], ['zephyr', 9], ['chill', 9],
  ['immolate', 8], ['stonewall', 8], ['rampart', 8], ['cyclone', 8],
  ['quake', 5], ['frostbite', 5], ['wildfire', 4], ['tailwind', 4],
  ['cinderNova', 3], ['avalanche', 3], ['phoenixHeart', 3], ['deepFreeze', 2],
];
