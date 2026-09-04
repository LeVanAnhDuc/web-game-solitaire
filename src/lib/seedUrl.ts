/**
 * The deal number in the address bar - FR-13, ADR-0006.
 *
 * A deal is a pure function of its seed, so a URL is enough to reopen an exact game
 * without storing anything on the player's machine (which ADR-0005 rules out). It is
 * also what lets the e2e suite play a fixed position instead of whatever it was dealt.
 */

export const SEED_PARAM = "van";

/** Seeds are 32-bit; anything else in the URL is treated as absent, never an error. */
export function readSeedFromUrl(search: string): number | undefined {
  const raw = new URLSearchParams(search).get(SEED_PARAM);
  if (raw === null) return undefined;
  const seed = Number(raw);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return undefined;
  return seed;
}

/**
 * Keeps the address in step with the game on screen. replaceState rather than
 * pushState: a new deal is not somewhere the back button should return to.
 */
export function writeSeedToUrl(seed: number): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set(SEED_PARAM, String(seed));
  window.history.replaceState(null, "", url);
}
