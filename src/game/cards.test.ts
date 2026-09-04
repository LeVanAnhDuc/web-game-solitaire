import { describe, expect, it } from "vitest";
import { RANKS, SUITS, cardId, colorOf, createDeck, sameColor } from "./cards";

describe("cardId", () => {
  it("builds the documented shape", () => {
    expect(cardId("hearts", 12)).toBe("hearts-12");
    expect(cardId("spades", 1)).toBe("spades-1");
  });
});

describe("colorOf", () => {
  it("makes hearts and diamonds red", () => {
    expect(colorOf("hearts")).toBe("red");
    expect(colorOf("diamonds")).toBe("red");
  });

  it("makes spades and clubs black", () => {
    expect(colorOf("spades")).toBe("black");
    expect(colorOf("clubs")).toBe("black");
  });
});

describe("sameColor", () => {
  it("pairs the two reds and the two blacks", () => {
    expect(sameColor("hearts", "diamonds")).toBe(true);
    expect(sameColor("spades", "clubs")).toBe(true);
  });

  it("separates red from black - the tableau stacking rule depends on it", () => {
    expect(sameColor("hearts", "spades")).toBe(false);
    expect(sameColor("clubs", "diamonds")).toBe(false);
  });
});

describe("createDeck", () => {
  const deck = createDeck();

  it("has 52 cards", () => {
    expect(deck.length).toBe(52);
  });

  it("has 52 distinct ids", () => {
    expect(new Set(deck.map((c) => c.id)).size).toBe(52);
  });

  it("has 13 cards of each suit and 4 of each rank", () => {
    for (const suit of SUITS) {
      expect(deck.filter((c) => c.suit === suit).length).toBe(13);
    }
    for (const rank of RANKS) {
      expect(deck.filter((c) => c.rank === rank).length).toBe(4);
    }
  });

  it("is unshuffled and identical on every call - shuffling is rng.ts's job", () => {
    expect(createDeck()).toEqual(deck);
    expect(deck[0]).toEqual({ id: "spades-1", suit: "spades", rank: 1 });
    expect(deck[51]).toEqual({ id: "clubs-13", suit: "clubs", rank: 13 });
  });

  it("returns a fresh array each call, so a caller cannot poison the next deal", () => {
    expect(createDeck()).not.toBe(createDeck());
  });

  it("carries no faceUp flag - ADR-0002, invariant #5", () => {
    for (const card of deck) {
      expect(Object.keys(card).sort()).toEqual(["id", "rank", "suit"]);
    }
  });
});
