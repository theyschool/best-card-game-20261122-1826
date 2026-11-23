// render.js — everything ASHDECK draws. Reads a Run (run.js) and paints it into
// the page shell: HUD, enemy stage with its intent chip and statuses, the hand,
// the piles, the combat log, floating combat text, and the overlay screens
// (title, draft, victory, defeat). It owns no rules — combat.js decides what
// happens; this file only shows it, with CSS doing the sliding and snapping.

import { CARDS, HOUSES } from './cards.js';
import { FLOOR_COUNT } from './enemies.js';

const $ = (id) => document.getElementById(id);

/** One card face. `index` staggers the deal-in animation; `state` is
 *  'playable', 'unaffordable' or 'still' (draft picks and staged scenes). */
export function cardElement(cardId, { index = 0, state = 'still' } = {}) {
  const def = CARDS[cardId];
  const house = HOUSES[def.house];
  const el = document.createElement('article');
  el.className = `card ${state}`;
  el.style.setProperty('--house', house.colour);
  el.style.setProperty('--i', index);
  el.dataset.cardId = cardId;
  el.innerHTML = `
    <div class="card-top"><span class="card-cost">${def.cost}</span><span class="card-name">${def.name}</span></div>
    <div class="card-art"><span class="card-glyph">${house.glyph}</span></div>
    <div class="card-type"><span>${def.type}</span><span class="card-house-name">${house.name} ${house.glyph}</span></div>
    <div class="card-text">${def.text}</div>
    <div class="card-foot"><span class="card-house-shape">${house.glyph}</span><span class="card-rarity rarity-${def.rarity.toLowerCase()}">${def.rarity.toUpperCase()}</span></div>`;
  return el;
}

function statusChip(kind, text) {
  const chip = document.createElement('span');
  chip.className = `status-chip ${kind}`;
  chip.textContent = text;
  return chip;
}

export class Renderer {
  constructor(callbacks) {
    this.cb = callbacks; // { onPlayCard, onEndTurn, onStart, onDraft }
    this.lastHitStamp = 0;
  }

  render(run) {
    this.renderHud(run);
    if (run.combat) this.renderCombat(run);
    this.renderOverlay(run);
  }

  renderHud(run) {
    const floors = $('hud-floors');
    floors.innerHTML = '';
    for (let f = 1; f <= FLOOR_COUNT; f++) {
      const pip = document.createElement('span');
      pip.className = 'floor-pip' + (f === FLOOR_COUNT ? ' boss' : '') + (f < run.floor ? ' done' : f === run.floor ? ' now' : '');
      pip.textContent = f === FLOOR_COUNT ? 'B' : String(f);
      floors.appendChild(pip);
    }
    const hp = run.phase === 'combat' || run.phase === 'draft' ? (run.combat ? run.combat.player.hp : run.hp) : run.hp;
    $('hp-fill').style.width = `${Math.max(0, (hp / run.maxHp) * 100)}%`;
    $('hp-text').textContent = `${hp} / ${run.maxHp}`;
    $('hud-score').textContent = String(run.score + (run.combat && run.phase === 'combat' ? run.combat.damageDealt : 0));
    $('hud-deck-count').textContent = String(run.deckIds.length);
  }

  renderCombat(run) {
    const combat = run.combat;
    const { player, enemy } = combat;

    // Intent chip: what the enemy will do, readable before you commit a card.
    const intent = combat.intentText();
    const chip = $('intent-chip');
    chip.className = 'intent-chip' + (intent.threat ? ' threat' : '') + (intent.frozen ? ' frozen' : '');
    chip.innerHTML = `<span>${intent.label}</span><span class="intent-kind">${intent.detail}</span>`;

    // Enemy portrait: a CSS ash wraith, crowned when it is the boss.
    const portrait = $('enemy-portrait');
    portrait.innerHTML = '';
    const wraith = document.createElement('div');
    wraith.className = 'wraith' + (enemy.def.boss ? ' boss' : '');
    wraith.style.setProperty('--wraith-eye', enemy.def.eye);
    wraith.innerHTML = `${enemy.def.boss ? '<span class="wraith-crown"><i></i><i></i><i></i></span>' : ''}<span class="wraith-mouth"></span>`;
    portrait.appendChild(wraith);
    if (combat.enemyHitStamp !== this.lastHitStamp) {
      this.lastHitStamp = combat.enemyHitStamp;
      wraith.classList.add('shake');
    }

    $('enemy-name').textContent = enemy.name;
    $('enemy-hp-fill').style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
    $('enemy-hp-text').textContent = `${enemy.hp} / ${enemy.maxHp}`;

    const eStatuses = $('enemy-statuses');
    eStatuses.innerHTML = '';
    if (enemy.block > 0) eStatuses.appendChild(statusChip('blockchip', `Block ${enemy.block}`));
    if (enemy.burn > 0) eStatuses.appendChild(statusChip('burn', `Burn ${enemy.burn}`));
    if (enemy.vuln > 0) eStatuses.appendChild(statusChip('vuln', `Vulnerable ${enemy.vuln}`));
    if (enemy.weak > 0) eStatuses.appendChild(statusChip('weak', `Weak ${enemy.weak}`));
    if (enemy.strength > 0) eStatuses.appendChild(statusChip('str', `Strength +${enemy.strength}`));
    if (enemy.frozen) eStatuses.appendChild(statusChip('weak', 'Frozen'));

    // Player badges, statuses, log.
    $('block-value').textContent = String(player.block);
    $('energy-value').textContent = `${player.energy} / 3`;
    const pStatuses = $('player-statuses');
    pStatuses.innerHTML = '';
    if (player.strength > 0) pStatuses.appendChild(statusChip('str', `Strength +${player.strength}`));
    $('combat-log').innerHTML = combat.log;

    // Hand.
    const hand = $('hand');
    hand.innerHTML = '';
    combat.deck.hand.forEach((card, i) => {
      const state = run.phase !== 'combat' ? 'still' : combat.canPlay(card) ? 'playable' : 'unaffordable';
      const el = cardElement(card.id, { index: i, state });
      if (state === 'playable') el.addEventListener('click', () => this.cb.onPlayCard(i, el));
      hand.appendChild(el);
    });

    $('draw-count').textContent = String(combat.deck.drawPile.length);
    $('discard-count').textContent = String(combat.deck.discardPile.length);
    $('end-turn').disabled = run.phase !== 'combat';

    // Floating combat text queued by the rules since the last render.
    const fxLayer = $('fx-layer');
    combat.fx.forEach((fx, i) => {
      const el = document.createElement('div');
      el.className = `floater ${fx.kind}`;
      el.textContent = fx.text;
      const atEnemy = fx.at === 'enemy';
      el.style.left = `calc(50% + ${(i % 3 - 1) * 74}px)`;
      el.style.top = atEnemy ? '120px' : '520px';
      fxLayer.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    });
    combat.fx = [];
  }

  renderOverlay(run) {
    const overlay = $('overlay');
    overlay.innerHTML = '';
    overlay.classList.remove('show');
    if (run.phase === 'combat') return;

    const veil = document.createElement('div');
    veil.className = 'overlay-veil';
    if (run.phase === 'title') {
      veil.innerHTML = `
        <h1 class="overlay-title"><span class="brand-mark">▲</span>ASHDECK</h1>
        <p class="overlay-sub">A roguelike deck-builder. Climb <b>six floors</b> of ash with a deck you
        build as you go: read each enemy's <b>intent</b>, counter it, draft a new card after every
        floor — and bring down <b>the Cindermaw</b>.</p>
        <p class="overlay-sub">Click a card to play it · <b>E</b> ends your turn · ▲ Ember ■ Stone ● Gale ◆ Frost</p>`;
      const button = document.createElement('button');
      button.className = 'overlay-button';
      button.textContent = 'START THE CLIMB';
      button.addEventListener('click', () => this.cb.onStart());
      veil.appendChild(button);
    } else if (run.phase === 'draft') {
      veil.innerHTML = `
        <h1 class="overlay-title" style="font-size:44px">FLOOR ${run.floor} CLEARED!</h1>
        <p class="overlay-sub">Draft one card into your deck — or skip. You rest by the embers: <b>+12 HP</b>.
        Score so far: <b>${run.score}</b></p>`;
      const row = document.createElement('div');
      row.className = 'draft-row';
      run.draftChoices.forEach((cardId) => {
        const pick = document.createElement('div');
        pick.className = 'draft-pick';
        pick.appendChild(cardElement(cardId, { state: 'still' }));
        pick.addEventListener('click', () => this.cb.onDraft(cardId));
        row.appendChild(pick);
      });
      veil.appendChild(row);
      const skip = document.createElement('button');
      skip.className = 'overlay-button';
      skip.textContent = 'SKIP THE DRAFT';
      skip.addEventListener('click', () => this.cb.onDraft(null));
      veil.appendChild(skip);
    } else if (run.phase === 'victory') {
      veil.innerHTML = `
        <h1 class="overlay-title" style="font-size:46px">THE CINDERMAW IS ASH</h1>
        <p class="overlay-sub">Six floors climbed, the boss burned, and your deck — built one draft
        at a time — did it. The ash settles. For now.</p>
        <p class="overlay-score">Final score <strong>${run.score}</strong> · HP left ${run.hp} / ${run.maxHp} · Deck of ${run.deckIds.length} cards</p>`;
      const button = document.createElement('button');
      button.className = 'overlay-button';
      button.textContent = 'PLAY AGAIN';
      button.addEventListener('click', () => this.cb.onStart());
      veil.appendChild(button);
    } else if (run.phase === 'defeat') {
      veil.innerHTML = `
        <h1 class="overlay-title" style="font-size:46px">THE ASH CLAIMS YOU</h1>
        <p class="overlay-sub">You fell on <b>floor ${run.floor}</b> to the ${run.combat ? run.combat.enemy.name : 'ash'}.
        Every climber's deck ends up scattered in the ash — the next one starts stronger for what you learned.</p>
        <p class="overlay-score">Score <strong>${run.score}</strong> · Floors cleared ${run.floor - 1} of ${FLOOR_COUNT}</p>`;
      const button = document.createElement('button');
      button.className = 'overlay-button';
      button.textContent = 'TRY AGAIN';
      button.addEventListener('click', () => this.cb.onStart());
      veil.appendChild(button);
    }
    overlay.appendChild(veil);
    overlay.classList.add('show');
  }
}
