// main.ts — ASHDECK's hand-in program (Node 22, standard library only).
//
// The game itself is the static game/ folder beside this file: plain HTML, CSS and
// ES modules a desktop browser runs offline. This program hands it in the way the
// bounty asks: it copies game/ and screenshots/ into the output directory and
// writes dossier.json there with buildDossier from the vendored make.fun library
// (vendor/makefun-game.ts, the kit's copy, unchanged — the scorer rebuilds the
// dossier with the same library and compares byte for byte, so the caps below
// mirror the gate's: at most 4 screenshots of 256 KiB, at most 993 game files and
// 48 MiB of game, no game path over 1,000 bytes, dossier text capped at 160 KiB).
//
// In the grader the output directory is /output; anywhere else the environment
// variable MAKEFUN_OUTPUT_DIR stands in for it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight: refuse to hand in a broken entry. The gate would list it invalid
// anyway; failing here, loudly and before copying anything, says what is wrong
// while it can still be fixed.
const gameDir = join(repoRoot, 'game');
const screenshotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing: there is no game to hand in');
}
const shotNames = existsSync(screenshotsDir)
  ? readdirSync(screenshotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name) && !name.startsWith('.'))
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images for the judge; found ${shotNames.length}`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });

mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(screenshotsDir, join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`ASHDECK handed in: game/ and ${shotNames.length} screenshots copied to ${outputDir}, dossier.json written (${dossier.length} bytes).`);
