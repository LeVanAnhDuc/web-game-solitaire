/**
 * The 52-card deck. Framework-free by construction - invariant #1.
 *
 * A card carries no state: no faceUp flag, no position. Whether it is face up is a
 * property of the pile holding it (ADR-0002), which makes the mismatched-flag bug
 * unrepresentable rather than something tests have to catch.
 */

export const SUITS = ["spades", "hearts", "diamonds", "clubs"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
/** 1 = A, 11 = J, 12 = Q, 13 = K. */
export type Rank = (typeof RANKS)[number];

export type Color = "red" | "black";

/** Unique within a deck: "hearts-12". Stable for the whole game - invariant #8. */
export type CardId = string;

export type Card = { readonly id: CardId; readonly suit: Suit; readonly rank: Rank };

export function cardId(suit: Suit, rank: Rank): CardId {
  return `${suit}-${rank}`;
}

export function colorOf(suit: Suit): Color {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function sameColor(a: Suit, b: Suit): boolean {
  return colorOf(a) === colorOf(b);
}

/** 52 distinct cards in a fixed order. Shuffling is rng.ts's job, not this one's. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: cardId(suit, rank), suit, rank });
    }
  }
  return deck;
}
