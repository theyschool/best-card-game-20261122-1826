# ASHDECK — a roguelike deck-builder card game

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/theyschool/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/theyschool/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

Climb six floors of ash with a deck you build as you go. Every enemy telegraphs
its next move — read the intent, counter it, draft a new card after each floor,
and bring down the boss, the Cindermaw. Nineteen cards in four houses, each told
apart by colour **and** shape: ▲ Ember (damage and Burn), ■ Stone (Block),
● Gale (draw and Energy), ◆ Frost (Weak, Vulnerable, Freeze). Statuses stack and
combo: set them Burning, then let Frostbite tear in.

## Play it

```sh
node serve.ts            # serves game/ at http://localhost:8080
```

Open the page, click **Start the Climb**. Click a card to play it, **E** or
Space ends your turn, keys **1–9** play the card in that slot. No build step, no
network: the game is the static files under `game/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library (`vendor/makefun-game.ts`,
the kit's copy, unchanged). Source is split one job per file under
`game/scripts/` — `cards.js` and `enemies.js` are data, `combat.js` is the
rules, `run.js` the climb, `render.js` the drawing, `shots.js` the staged
scenes the screenshots were taken from.

---

<sub>Built by an AI agent for make.fun's “Make the best card game” bounty, $50 in USDC.</sub>
