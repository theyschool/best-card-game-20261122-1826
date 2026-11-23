// shots.js — staged scenes for the screenshots in shots.json. Each scene drives
// the real game modules (a Run, a Combat) into a rich, readable moment and
// leaves it there: the title over a fresh table, a mid-battle floor-3 fight
// with the enemy Burning and a counter in hand, the draft after a cleared
// floor, and the boss fight that ended a run. Nothing here is drawn by hand —
// render.js paints these states exactly as it paints live play.

import { cardInstance } from './deck.js';
import { enemyForFloor } from './enemies.js';
import { Run } from './run.js';

function setHand(combat, ids) {
  combat.deck.hand = ids.map(cardInstance);
}

function setPiles(combat, drawCount, discardCount) {
  const filler = ['strike', 'guard', 'kindle', 'strike', 'guard', 'strike', 'kindle', 'guard'];
  combat.deck.drawPile = Array.from({ length: drawCount }, (_, i) => cardInstance(filler[i % filler.length]));
  combat.deck.discardPile = Array.from({ length: discardCount }, (_, i) => cardInstance(filler[(i + 3) % filler.length]));
}

function stageTitle(seed) {
  const run = new Run(seed);
  run.beginFloor(1);
  run.phase = 'title';
  return run;
}

function stageBattle(seed) {
  const run = new Run(seed);
  run.deckIds = [...run.deckIds, 'flameLash', 'frostbite', 'tailwind'];
  run.beginFloor(3);
  const combat = run.combat;
  run.hp = 44;
  combat.player.hp = 44;
  combat.player.block = 6;
  combat.player.energy = 2;
  combat.turn = 3;
  combat.enemy.hp = 41;
  combat.enemy.burn = 3;
  combat.enemy.vuln = 1;
  combat.enemy.intent = { move: enemyForFloor(3).moves.find((m) => m.label === 'Cleave') };
  setHand(combat, ['flameLash', 'frostbite', 'bulwark', 'guard', 'tailwind']);
  setPiles(combat, 4, 3);
  combat.log = 'The knight is <b>Burning</b> — Frostbite would tear into it now.';
  run.score = 268;
  return run;
}

function stageVictory(seed) {
  const run = new Run(seed);
  run.deckIds = [...run.deckIds, 'flameLash', 'frostbite', 'tailwind'];
  run.beginFloor(3);
  const combat = run.combat;
  run.hp = 38;
  combat.player.hp = 38;
  combat.enemy.hp = 0;
  run.score = 512;
  run.draftChoices = ['wildfire', 'deepFreeze', 'tailwind'];
  run.phase = 'draft';
  return run;
}

function stageDefeat(seed) {
  const run = new Run(seed);
  run.deckIds = [...run.deckIds, 'flameLash', 'frostbite', 'tailwind', 'quake', 'bulwark'];
  run.beginFloor(6);
  const combat = run.combat;
  run.hp = 0;
  combat.player.hp = 0;
  combat.player.energy = 1;
  combat.enemy.hp = 37;
  combat.enemy.intent = { move: enemyForFloor(6).moves.find((m) => m.label === 'Maw Bite') };
  setHand(combat, ['strike', 'guard', 'quake']);
  setPiles(combat, 5, 6);
  run.score = 743;
  run.phase = 'defeat';
  return run;
}

const SCENES = {
  title: stageTitle,
  battle: stageBattle,
  victory: stageVictory,
  defeat: stageDefeat,
};

/** Build the staged Run for a ?shot= name; unknown names get the title scene. */
export function stageShot(name, seed) {
  return (SCENES[name] ?? stageTitle)(seed);
}
