// main.js — ASHDECK's boot and input. Two ways in:
//   play:        index.html            a fresh Run behind the title screen
//   screenshots: index.html?shot=NAME  the staged scene shots.js builds for
//                                      NAME, rendered once and left standing
//                                      (window.__shotReady flags when it has
//                                      settled, for the screenshot tooling)
// Input is mouse (click a card, click END TURN) and keyboard (1–9 plays a
// card, E or Space ends the turn, Enter starts/restarts from a screen).

import { Renderer } from './render.js';
import { Run } from './run.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));

let run = null;
let settledCombat = null; // the combat whose result has already been settled

const renderer = new Renderer({
  onPlayCard(index, element) {
    if (!run || run.phase !== 'combat') return;
    element.classList.add('played');
    setTimeout(() => {
      run.combat.playCard(index);
      refresh();
    }, 190);
  },
  onEndTurn() {
    if (!run || run.phase !== 'combat') return;
    run.combat.endTurn();
    refresh();
  },
  onStart() {
    run = new Run(freshSeed());
    settledCombat = null;
    run.start();
    refresh();
  },
  onDraft(cardId) {
    if (!run || run.phase !== 'draft') return;
    run.takeDraft(cardId);
    settledCombat = null;
    refresh();
  },
});

function freshSeed() {
  return (Date.now() % 90000) + 11;
}

/** Settle a finished combat into the run (score, draft, endings), then draw. */
function refresh() {
  if (
    run.phase === 'combat' &&
    run.combat &&
    run.combat.phase !== 'player' &&
    settledCombat !== run.combat
  ) {
    settledCombat = run.combat;
    run.settleCombat();
  }
  renderer.render(run);
}

document.getElementById('end-turn').addEventListener('click', () => renderer.cb.onEndTurn());

document.addEventListener('keydown', (event) => {
  if (shotName) return;
  if (!run) return;
  if (run.phase === 'combat') {
    if (event.key === 'e' || event.key === 'E' || event.key === ' ') {
      event.preventDefault();
      renderer.cb.onEndTurn();
    } else if (/^[1-9]$/.test(event.key)) {
      const cardEl = document.querySelectorAll('#hand .card')[Number(event.key) - 1];
      if (cardEl && cardEl.classList.contains('playable')) cardEl.click();
    }
  } else if (event.key === 'Enter' && run.phase !== 'draft') {
    renderer.cb.onStart();
  }
});

if (shotName) {
  run = stageShot(shotName, Number.isInteger(seedParam) && seedParam > 0 ? seedParam : 7);
  renderer.render(run);
  // Let the deal-in animations land before the screenshot is taken.
  setTimeout(() => {
    window.__shotReady = true;
  }, 1000);
} else {
  // A live floor-1 table stands behind the title screen.
  run = new Run(freshSeed());
  run.beginFloor(1);
  run.phase = 'title';
  renderer.render(run);
}
