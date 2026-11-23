// rng.js — ASHDECK's seeded random number generator. A run is fully determined
// by its seed (mulberry32), so a shared seed replays the same shuffles, draws and
// enemy moves — and the screenshot scenes come out identical on every machine.

export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Integer in [min, max], both ends included. */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** One element of a non-empty array. */
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    /** A shuffled copy of the array (Fisher–Yates); the input is not touched. */
    shuffled(items) {
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    /** Weighted pick: entries are [value, weight] pairs. */
    weighted(pairs) {
      const total = pairs.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, w] of pairs) {
        roll -= w;
        if (roll <= 0) return value;
      }
      return pairs[pairs.length - 1][0];
    },
  };
}
