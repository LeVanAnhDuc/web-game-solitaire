import { describe, expect, it } from "vitest";
import { SUITS, cardId, createDeck, type Card, type Rank, type Suit } from "./cards";
import {
  DECK_SIZE,
  FOUNDATION_SUITS,
  TABLEAU_COUNT,
  canAutoComplete,
  cardCount,
  cardsOf,
  isWon,
  pileIdEquals,
  pileKey,
  topCard,
  type GameState,
} from "./state";

const card = (suit: Suit, rank: Rank): Card => ({ id: cardId(suit, rank), suit, rank });

const blank = (over: Partial<GameState> = {}): GameState => ({
  seed: 1,
  drawMode: 1,
  stock: [],
  waste: [],
  foundations: [[], [], [], []],
  tableau: Array.from({ length: TABLEAU_COUNT }, () => ({ down: [], up: [] })),
  ...over,
});

describe("pileIdEquals", () => {
  it("matches the two indexless piles by kind alone", () => {
    expect(pileIdEquals({ kind: "stock" }, { kind: "stock" })).toBe(true);
    expect(pileIdEquals({ kind: "waste" }, { kind: "waste" })).toBe(true);
  });

  it("separates different kinds", () => {
    expect(pileIdEquals({ kind: "stock" }, { kind: "waste" })).toBe(false);
    expect(
      pileIdEquals({ kind: "foundation", index: 0 }, { kind: "tableau", index: 0 }),
    ).toBe(false);
  });

  it("compares the index when there is one", () => {
    expect(
      pileIdEquals({ kind: "tableau", index: 3 }, { kind: "tableau", index: 3 }),
    ).toBe(true);
    expect(
      pileIdEquals({ kind: "tableau", index: 3 }, { kind: "tableau", index: 4 }),
    ).toBe(false);
    expect(
      pileIdEquals({ kind: "foundation", index: 1 }, { kind: "foundation", index: 2 }),
    ).toBe(false);
  });
});

describe("pileKey", () => {
  it("gives every pile a distinct key", () => {
    const keys = [
      pileKey({ kind: "stock" }),
      pileKey({ kind: "waste" }),
      ...([0, 1, 2, 3] as const).map((i) => pileKey({ kind: "foundation", index: i })),
      ...([0, 1, 2, 3, 4, 5, 6] as const).map((i) =>
        pileKey({ kind: "tableau", index: i }),
      ),
    ];
    expect(new Set(keys).size).toBe(keys.length);
    expect(pileKey({ kind: "tableau", index: 2 })).toBe("tableau-2");
  });
});

describe("cardsOf", () => {
  it("reads stock and waste as-is", () => {
    const s = blank({ stock: [card("spades", 5)], waste: [card("hearts", 9)] });
    expect(cardsOf(s, { kind: "stock" })).toEqual([card("spades", 5)]);
    expect(cardsOf(s, { kind: "waste" })).toEqual([card("hearts", 9)]);
  });

  it("reads a foundation by SUITS order", () => {
    const s = blank({ foundations: [[card("spades", 1)], [], [], []] });
    expect(cardsOf(s, { kind: "foundation", index: 0 })).toEqual([card("spades", 1)]);
    expect(cardsOf(s, { kind: "foundation", index: 1 })).toEqual([]);
  });

  it("reads a tableau column as down-then-up, bottom first", () => {
    const s = blank({
      tableau: [
        { down: [card("clubs", 4)], up: [card("hearts", 13), card("spades", 12)] },
        ...Array.from({ length: 6 }, () => ({ down: [], up: [] })),
      ],
    });
    expect(cardsOf(s, { kind: "tableau", index: 0 }).map((c) => c.id)).toEqual([
      "clubs-4",
      "hearts-13",
      "spades-12",
    ]);
  });
});

describe("topCard", () => {
  it("returns the LAST array element - the one convention of the codebase", () => {
    const s = blank({ waste: [card("spades", 2), card("hearts", 7)] });
    expect(topCard(s, { kind: "waste" })?.id).toBe("hearts-7");
  });

  it("prefers the face-up run over the face-down cards below it", () => {
    const s = blank({
      tableau: [
        { down: [card("clubs", 4)], up: [card("hearts", 13)] },
        ...Array.from({ length: 6 }, () => ({ down: [], up: [] })),
      ],
    });
    expect(topCard(s, { kind: "tableau", index: 0 })?.id).toBe("hearts-13");
  });

  it("returns undefined for an empty pile", () => {
    expect(topCard(blank(), { kind: "stock" })).toBeUndefined();
    expect(topCard(blank(), { kind: "foundation", index: 2 })).toBeUndefined();
    expect(topCard(blank(), { kind: "tableau", index: 6 })).toBeUndefined();
  });
});

describe("isWon", () => {
  it("is false on an empty board", () => {
    expect(isWon(blank())).toBe(false);
  });

  it("is true only when all 52 cards sit on the foundations", () => {
    const deck = createDeck();
    const bySuit = (suit: Suit) => deck.filter((c) => c.suit === suit);
    const full = blank({ foundations: SUITS.map(bySuit) });
    expect(cardCount(full)).toBe(DECK_SIZE);
    expect(isWon(full)).toBe(true);

    const oneShort = blank({
      foundations: SUITS.map((s, i) => (i === 0 ? bySuit(s).slice(0, 12) : bySuit(s))),
      waste: [card("spades", 13)],
    });
    expect(isWon(oneShort)).toBe(false);
  });
});

describe("canAutoComplete", () => {
  it("is true when no card is face down any more", () => {
    const s = blank({
      stock: [card("spades", 1)],
      tableau: Array.from({ length: TABLEAU_COUNT }, () => ({ down: [], up: [] })),
    });
    expect(canAutoComplete(s)).toBe(true);
  });

  it("is false while a single card is still face down", () => {
    const s = blank({
      tableau: [
        { down: [card("clubs", 4)], up: [card("hearts", 13)] },
        ...Array.from({ length: 6 }, () => ({ down: [], up: [] })),
      ],
    });
    expect(canAutoComplete(s)).toBe(false);
  });

  it("is false on a won board - there is nothing left to finish", () => {
    const deck = createDeck();
    const full = blank({
      foundations: SUITS.map((s) => deck.filter((c) => c.suit === s)),
    });
    expect(canAutoComplete(full)).toBe(false);
  });
});

describe("cardCount", () => {
  it("adds up every region of the board", () => {
    const s = blank({
      stock: [card("spades", 2)],
      waste: [card("hearts", 3)],
      foundations: [[card("spades", 1)], [], [], []],
      tableau: [
        { down: [card("clubs", 4)], up: [card("diamonds", 5)] },
        ...Array.from({ length: 6 }, () => ({ down: [], up: [] })),
      ],
    });
    expect(cardCount(s)).toBe(5);
  });
});

describe("FOUNDATION_SUITS", () => {
  it("is SUITS, so foundation index i means suit SUITS[i]", () => {
    expect(FOUNDATION_SUITS).toEqual([...SUITS]);
  });
});
