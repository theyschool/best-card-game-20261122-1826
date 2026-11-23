// run.js — a whole run of ASHDECK: six floors up the ash, a draft after every
// floor but the last, a short rest that comes with the draft, and the two ways a
// run ends. Owns the persistent things a single Combat does not: the deck list,
// the player's HP between floors, the floor number and the score.

import { Combat, TURN_ENERGY } from './combat.js';
import { DRAFT_POOL, STARTER_DECK } from './cards.js';
import { FLOOR_COUNT, enemyForFloor } from './enemies.js';
import { makeRng } from './rng.js';

export const PLAYER_MAX_HP = 66;
export const REST_HEAL = 12;
const FLOOR_SCORE = 100;

export class Run {
  constructor(seed) {
    this.rng = makeRng(seed);
    this.seed = seed;
    this.deckIds = [...STARTER_DECK];
    this.maxHp = PLAYER_MAX_HP;
    this.hp = PLAYER_MAX_HP;
    this.floor = 1;
    this.score = 0;
    this.phase = 'title'; // 'title' | 'combat' | 'draft' | 'victory' | 'defeat'
    this.combat = null;
    this.draftChoices = [];
    this.turnEnergy = TURN_ENERGY;
  }

  start() {
    this.beginFloor(1);
  }

  beginFloor(floor) {
    this.floor = floor;
    const enemyDef = enemyForFloor(floor);
    this.combat = new Combat(this.rng, this.deckIds, enemyDef, { hp: this.hp, maxHp: this.maxHp });
    this.phase = 'combat';
  }

  /** Called by the UI whenever a combat's phase flips to 'won' or 'lost'. */
  settleCombat() {
    if (!this.combat) return;
    this.hp = this.combat.player.hp;
    this.score += this.combat.damageDealt;
    if (this.combat.phase === 'lost') {
      this.phase = 'defeat';
      return;
    }
    if (this.combat.phase !== 'won') return;
    this.score += FLOOR_SCORE;
    if (this.floor >= FLOOR_COUNT) {
      this.score += this.hp * 2; // the survivor's bonus
      this.phase = 'victory';
      return;
    }
    this.draftChoices = this.rollDraft();
    this.phase = 'draft';
  }

  /** Three distinct cards, weighted by rarity, none of them a duplicate pick. */
  rollDraft() {
    const picks = [];
    const pool = DRAFT_POOL.map(([id, w]) => [id, w]);
    while (picks.length < 3 && pool.length > 0) {
      const id = this.rng.weighted(pool);
      picks.push(id);
      pool.splice(pool.findIndex(([pid]) => pid === id), 1);
    }
    return picks;
  }

  /** Take a drafted card (or null to skip), rest, and climb to the next floor. */
  takeDraft(cardId) {
    if (cardId) this.deckIds.push(cardId);
    this.hp = Math.min(this.maxHp, this.hp + REST_HEAL);
    this.beginFloor(this.floor + 1);
  }
}
