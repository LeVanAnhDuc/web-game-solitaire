import { SUITS, type Card, type Suit } from "./cards";

/**
 * The shape of a game in progress, and the pure readers over it. No rules live here -
 * those are moves.ts, the single source of the rules (invariant #2).
 *
 * ONE CONVENTION THROUGHOUT: the LAST element of every array is the TOP card. It
 * holds for all four pile kinds without exception. Mixing the two conventions in one
 * project is a guaranteed off-by-one.
 */

export type DrawMode = 1 | 3;

/** A tableau column: face-down cards below, the face-up run above. */
export type TableauColumn = { readonly down: readonly Card[]; readonly up: readonly Card[] };

export type FoundationIndex = 0 | 1 | 2 | 3;
export type TableauIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PileId =
  | { readonly kind: "stock" }
  | { readonly kind: "waste" }
  | { readonly kind: "foundation"; readonly index: FoundationIndex }
  | { readonly kind: "tableau"; readonly index: TableauIndex };

export type GameState = {
  readonly seed: number;
  readonly drawMode: DrawMode;
  readonly stock: readonly Card[];
  readonly waste: readonly Card[];
  /** Four piles, in SUITS order: spades, hearts, diamonds, clubs. */
  readonly foundations: readonly (readonly Card[])[];
  /** Exactly seven columns. */
  readonly tableau: readonly TableauColumn[];
};

export const TABLEAU_COUNT = 7;
export const FOUNDATION_COUNT = 4;
export const DECK_SIZE = 52;

export const FOUNDATION_SUITS: readonly Suit[] = SUITS;

export function pileIdEquals(a: PileId, b: PileId): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "foundation" && b.kind === "foundation") return a.index === b.index;
  if (a.kind === "tableau" && b.kind === "tableau") return a.index === b.index;
  return true;
}

export function pileKey(p: PileId): string {
  return p.kind === "foundation" || p.kind === "tableau" ? `${p.kind}-${p.index}` : p.kind;
}

/** The cards of a pile, bottom first. For a tableau column, down then up. */
export function cardsOf(s: GameState, p: PileId): readonly Card[] {
  switch (p.kind) {
    case "stock":
      return s.stock;
    case "waste":
      return s.waste;
    case "foundation":
      return s.foundations[p.index] ?? [];
    case "tableau": {
      const col = s.tableau[p.index];
      return col ? [...col.down, ...col.up] : [];
    }
  }
}

/** The playable top card, or undefined for an empty pile. */
export function topCard(s: GameState, p: PileId): Card | undefined {
  const cards = cardsOf(s, p);
  return cards[cards.length - 1];
}

export function isWon(s: GameState): boolean {
  return s.foundations.reduce((n, f) => n + f.length, 0) === DECK_SIZE;
}

/**
 * True when nothing is hidden any more, so the rest of the game is mechanical and the
 * "Hoàn tất" button can finish it (FR-06). Stock and waste may still hold cards - the
 * auto-complete sequence draws through them.
 */
export function canAutoComplete(s: GameState): boolean {
  if (isWon(s)) return false;
  return s.tableau.every((col) => col.down.length === 0);
}

/** Total cards on the board. Used by tests to assert nothing is created or lost. */
export function cardCount(s: GameState): number {
  return (
    s.stock.length +
    s.waste.length +
    s.foundations.reduce((n, f) => n + f.length, 0) +
    s.tableau.reduce((n, c) => n + c.down.length + c.up.length, 0)
  );
}
