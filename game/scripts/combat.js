// combat.js — one fight: the player's turn, the enemy's telegraphed intent, and
// every rule that connects them. Pure state and rules, no DOM: render.js draws
// what this class holds, and shots.js stages fights by driving it directly.
//
// Turn shape: the player starts with 3 Energy and 5 cards, plays cards, then
// ends the turn; the enemy carries out the intent it showed all along, a new
// intent is drawn, the player's Block falls away and a fresh hand is dealt.

import { CARDS } from './cards.js';
import { Deck } from './deck.js';

export const HAND_SIZE = 5;
export const TURN_ENERGY = 3;

export class Combat {
  constructor(rng, deckIds, enemyDef, player) {
    this.rng = rng;
    this.deck = new Deck(rng, deckIds);
    this.player = {
      hp: player.hp,
      maxHp: player.maxHp,
      block: 0,
      energy: TURN_ENERGY,
      strength: 0,
      sapped: false,
    };
    this.enemy = {
      def: enemyDef,
      name: enemyDef.name,
      hp: enemyDef.hp,
      maxHp: enemyDef.hp,
      block: 0,
      strength: 0,
      burn: 0,
      vuln: 0,
      weak: 0,
      frozen: false,
      intent: null,
    };
    this.turn = 1;
    this.phase = 'player'; // 'player' | 'won' | 'lost'
    this.damageDealt = 0;
    this.log = `<b>${enemyDef.name}</b> rises from the ash. Your move.`;
    this.fx = []; // floating combat text for render.js: { text, kind, at }
    this.enemyHitStamp = 0; // bumped whenever the enemy takes a hit (shake)
    this.chooseIntent();
    this.deck.draw(HAND_SIZE);
  }

  // ---------- intents ----------

  chooseIntent() {
    const moves = this.enemy.def.moves;
    const pairs = moves.map((m) => [m, m.weight ?? 1]);
    let move = this.rng.weighted(pairs);
    // Never show the same non-attack move three turns running; it reads as a stall.
    if (this.enemy.intent && move === this.enemy.intent.move && move.kind !== 'attack') {
      move = this.rng.weighted(pairs);
    }
    this.enemy.intent = { move };
  }

  /** What the intent chip should say, e.g. "Cleave — ATK 11". */
  intentText() {
    const { move } = this.enemy.intent;
    if (this.enemy.frozen) return { label: move.label, detail: 'FROZEN', threat: false, frozen: true };
    switch (move.kind) {
      case 'attack': {
        const per = Math.max(0, Math.floor((move.amount + this.enemy.strength) * (this.enemy.weak > 0 ? 0.75 : 1)));
        const times = move.times && move.times > 1 ? ` ×${move.times}` : '';
        return { label: move.label, detail: `ATK ${per}${times}`, threat: true, frozen: false };
      }
      case 'block': return { label: move.label, detail: `BLOCK ${move.amount}`, threat: false, frozen: false };
      case 'buff': return { label: move.label, detail: `BUFF +${move.amount} STR`, threat: false, frozen: false };
      case 'sap': return { label: move.label, detail: 'SAP: −1 ENERGY', threat: true, frozen: false };
      case 'drain': return { label: move.label, detail: `DRAIN ${move.amount}`, threat: true, frozen: false };
      default: return { label: move.label, detail: '', threat: false, frozen: false };
    }
  }

  // ---------- damage ----------

  damageEnemy(amount, { ignoreBlock = false } = {}) {
    let dmg = amount;
    if (this.enemy.vuln > 0) dmg = Math.floor(dmg * 1.5);
    let through = dmg;
    if (!ignoreBlock && this.enemy.block > 0) {
      const soaked = Math.min(this.enemy.block, dmg);
      this.enemy.block -= soaked;
      through = dmg - soaked;
      if (soaked > 0) this.fx.push({ text: `${soaked} blocked`, kind: 'block', at: 'enemy' });
    }
    if (through > 0) {
      this.enemy.hp = Math.max(0, this.enemy.hp - through);
      this.damageDealt += through;
      this.fx.push({ text: `-${through}`, kind: 'damage', at: 'enemy' });
      this.enemyHitStamp++;
    }
    if (this.enemy.hp <= 0) this.phase = 'won';
  }

  damagePlayer(amount) {
    let through = amount;
    if (this.player.block > 0) {
      const soaked = Math.min(this.player.block, amount);
      this.player.block -= soaked;
      through = amount - soaked;
      if (soaked > 0) this.fx.push({ text: `${soaked} blocked`, kind: 'block', at: 'player' });
    }
    if (through > 0) {
      this.player.hp = Math.max(0, this.player.hp - through);
      this.fx.push({ text: `-${through}`, kind: 'damage', at: 'player' });
    }
    if (this.player.hp <= 0) this.phase = 'lost';
  }

  // ---------- playing cards ----------

  canPlay(card) {
    return this.phase === 'player' && CARDS[card.id].cost <= this.player.energy;
  }

  playCard(handIndex) {
    if (this.phase !== 'player') return false;
    const card = this.deck.hand[handIndex];
    if (!card) return false;
    const def = CARDS[card.id];
    if (def.cost > this.player.energy) return false;
    this.player.energy -= def.cost;
    const fx = def.effects;

    if (fx.strength) {
      this.player.strength += fx.strength;
      this.fx.push({ text: `+${fx.strength} STR`, kind: 'status', at: 'player' });
    }
    if (fx.damage) {
      const hits = fx.hits ?? 1;
      for (let h = 0; h < hits && this.phase === 'player'; h++) {
        let dmg = fx.damage + this.player.strength;
        if (h === 0 && fx.bonusVsBurning && this.enemy.burn > 0) dmg += fx.bonusVsBurning;
        this.damageEnemy(dmg);
      }
    }
    if (fx.block) {
      this.player.block += fx.block;
      this.fx.push({ text: `+${fx.block} Block`, kind: 'block', at: 'player' });
    }
    if (fx.burn) {
      this.enemy.burn += fx.burn;
      this.fx.push({ text: `Burn ${this.enemy.burn}`, kind: 'status', at: 'enemy' });
    }
    if (fx.vuln) {
      this.enemy.vuln += fx.vuln;
      this.fx.push({ text: 'Vulnerable', kind: 'status', at: 'enemy' });
    }
    if (fx.weak) {
      this.enemy.weak += fx.weak;
      this.fx.push({ text: 'Weakened', kind: 'status', at: 'enemy' });
    }
    if (fx.freeze) {
      this.enemy.frozen = true;
      this.fx.push({ text: 'Frozen!', kind: 'status', at: 'enemy' });
    }
    if (fx.gainEnergy) this.player.energy += fx.gainEnergy;
    if (fx.draw) this.deck.draw(fx.draw);

    this.deck.release(card, { exhaust: Boolean(fx.exhaust) });
    this.log = `<b>${def.name}</b> — ${def.text.replace(/<[^>]+>/g, '')}`;
    if (this.phase === 'won') this.log = `<b>${def.name}</b> fells the ${this.enemy.name}!`;
    return true;
  }

  // ---------- the enemy's turn ----------

  endTurn() {
    if (this.phase !== 'player') return;
    this.deck.discardHand();
    this.enemyAct();
    if (this.phase !== 'player') return;
    // A new player turn: Block falls away, statuses tick down, fresh hand.
    this.player.block = 0;
    this.player.energy = TURN_ENERGY - (this.player.sapped ? 1 : 0);
    this.player.sapped = false;
    this.turn++;
    this.deck.draw(HAND_SIZE);
    this.chooseIntent();
  }

  enemyAct() {
    const enemy = this.enemy;
    // Burn ticks first, seeping past Block.
    if (enemy.burn > 0 && enemy.hp > 0) {
      const tick = enemy.burn;
      enemy.hp = Math.max(0, enemy.hp - tick);
      this.damageDealt += tick;
      this.fx.push({ text: `-${tick} burn`, kind: 'damage', at: 'enemy' });
      this.enemyHitStamp++;
      if (enemy.hp <= 0) {
        this.phase = 'won';
        this.log = `The ${enemy.name} burns away before it can move.`;
        return;
      }
    }
    const { move } = enemy.intent;
    if (enemy.frozen) {
      enemy.frozen = false;
      this.log = `The ${enemy.name} is <b>frozen</b> and cannot move.`;
    } else if (move.kind === 'attack' || move.kind === 'drain') {
      const times = move.times ?? 1;
      let totalThrough = 0;
      for (let h = 0; h < times; h++) {
        const before = this.player.hp;
        let dmg = move.amount + enemy.strength;
        if (enemy.weak > 0) dmg = Math.floor(dmg * 0.75);
        this.damagePlayer(Math.max(0, dmg));
        totalThrough += before - this.player.hp;
        if (this.phase === 'lost') break;
      }
      if (move.kind === 'drain' && totalThrough > 0 && enemy.hp > 0) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + totalThrough);
        this.fx.push({ text: `+${totalThrough} drained`, kind: 'heal', at: 'enemy' });
      }
      if (move.extra === 'sap') this.player.sapped = true;
      this.log = `<b>${move.label}</b> — the ${enemy.name} strikes${times > 1 ? ` ${times} times` : ''}.`;
    } else if (move.kind === 'block') {
      enemy.block += move.amount;
      if (move.buffAlso) enemy.strength += move.buffAlso;
      this.fx.push({ text: `+${move.amount} Block`, kind: 'block', at: 'enemy' });
      this.log = `The ${enemy.name} hardens itself with <b>${move.label}</b>.`;
    } else if (move.kind === 'buff') {
      enemy.strength += move.amount;
      this.fx.push({ text: `+${move.amount} STR`, kind: 'status', at: 'enemy' });
      this.log = `The ${enemy.name} uses <b>${move.label}</b> and grows stronger.`;
    } else if (move.kind === 'sap') {
      this.player.sapped = true;
      this.log = `<b>${move.label}</b> — you start next turn with 1 less Energy.`;
    }
    if (enemy.vuln > 0) enemy.vuln--;
    if (enemy.weak > 0) enemy.weak--;
  }
}
