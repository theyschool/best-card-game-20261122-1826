// enemies.js — the six things that live in the ash. One enemy per floor; floors
// 1–5 draw from the first five and floor 6 is always the boss, the Cindermaw.
// Every enemy telegraphs its next move as an intent, so the player can read it
// and counter: a move is data — combat.js carries it out.
//   attack  hit the player for `amount`, `times` times (its Strength adds on)
//   block   the enemy gains Block      buff   the enemy gains Strength
//   sap     the player starts next turn with 1 less Energy
//   drain   hit the player and heal the enemy for the same amount

export const ENEMIES = [
  {
    id: 'ash-imp', name: 'Ash Imp', hp: 34, eye: '#ffb347',
    moves: [
      { kind: 'attack', amount: 6, label: 'Scratch', weight: 3 },
      { kind: 'buff', amount: 1, label: 'Stoke', weight: 1 },
    ],
  },
  {
    id: 'cinder-hound', name: 'Cinder Hound', hp: 46, eye: '#ff8a5e',
    moves: [
      { kind: 'attack', amount: 8, label: 'Bite', weight: 2 },
      { kind: 'attack', amount: 5, times: 2, label: 'Pounce ×2', weight: 2 },
    ],
  },
  {
    id: 'soot-knight', name: 'Soot Knight', hp: 62, eye: '#a8d8ff',
    moves: [
      { kind: 'attack', amount: 11, label: 'Cleave', weight: 3 },
      { kind: 'block', amount: 10, label: 'Bulwark', weight: 2 },
      { kind: 'sap', label: 'Taunt', weight: 1 },
    ],
  },
  {
    id: 'pyre-witch', name: 'Pyre Witch', hp: 58, eye: '#e6b8ff',
    moves: [
      { kind: 'attack', amount: 9, label: 'Hex Bolt', weight: 3 },
      { kind: 'buff', amount: 2, label: 'Stoke Flames', weight: 1 },
      { kind: 'drain', amount: 5, label: 'Drain', weight: 2 },
    ],
  },
  {
    id: 'obsidian-golem', name: 'Obsidian Golem', hp: 76, eye: '#ffd98a',
    moves: [
      { kind: 'attack', amount: 14, label: 'Slam', weight: 3 },
      { kind: 'block', amount: 14, label: 'Harden', weight: 2 },
      { kind: 'attack', amount: 7, extra: 'sap', label: 'Tremor', weight: 1 },
    ],
  },
  {
    id: 'cindermaw', name: 'The Cindermaw', hp: 105, eye: '#ff5e4d', boss: true,
    moves: [
      { kind: 'attack', amount: 12, label: 'Maw Bite', weight: 3 },
      { kind: 'attack', amount: 6, times: 3, label: 'Ember Rain ×3', weight: 2 },
      { kind: 'buff', amount: 2, label: 'Roar', weight: 1 },
      { kind: 'block', amount: 12, buffAlso: 1, label: 'Swallow Heat', weight: 1 },
    ],
  },
];

export const FLOOR_COUNT = ENEMIES.length;

/** The enemy that waits on a 1-based floor. */
export function enemyForFloor(floor) {
  return ENEMIES[Math.min(floor, FLOOR_COUNT) - 1];
}
