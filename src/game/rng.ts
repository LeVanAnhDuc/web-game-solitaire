/**
 * Determinism lives here. Every shuffle in the game comes from a seed the player can
 * read off the screen, so a reported game can be reproduced exactly (ADR-0001).
 */

/**
 * mulberry32 - 32-bit state, one multiply-xorshift round, uniform enough for dealing
 * cards. Ten lines beats a dependency, and pinning the algorithm here means a seed
 * keeps dealing the same game across versions.
 */
export function mulberry32(seed: number): () => number {
  // >>> 0 folds negatives and floats into the 32-bit range the algorithm assumes.
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates over a copy. The copy is the point: the caller's deck is often a frozen
 * or shared array, and an in-place shuffle would be a mutation crossing a module
 * boundary - the class of bug invariant #4 exists to prevent.
 */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i];
    const b = out[j];
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * The ONLY Math.random in src/game, and nothing else in src/game may call this - the
 * UI calls it once when the player asks for a new game, then everything downstream is
 * a pure function of the result (invariant #3). Six digits so the seed stays readable
 * and shareable as a game number.
 */
export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000);
}
