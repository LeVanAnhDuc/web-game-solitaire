import { describe, expect, it } from "vitest";
import { deal } from "./deal";
import { DECK_SIZE, TABLEAU_COUNT, cardCount, type GameState } from "./state";

const allCards = (s: GameState) => [
  ...s.stock,
  ...s.waste,
  ...s.foundations.flat(),
  ...s.tableau.flatMap((c) => [...c.down, ...c.up]),
];

describe("deal", () => {
  it("gives the same board for the same seed - ADR-0001 rests on this", () => {
    expect(deal(2026, 1)).toEqual(deal(2026, 1));
    expect(deal(0, 3)).toEqual(deal(0, 3));
  });

  it("gives different boards for different seeds", () => {
    expect(deal(1, 1)).not.toEqual(deal(2, 1));
  });

  it("records the seed and draw mode it was given", () => {
    const s = deal(48213, 3);
    expect(s.seed).toBe(48213);
    expect(s.drawMode).toBe(3);
    expect(deal(48213, 1).drawMode).toBe(1);
  });

  it("lays out the same cards whatever the draw mode - only stock handling differs", () => {
    const one = deal(777, 1);
    const three = deal(777, 3);
    expect({ ...one, drawMode: 3 }).toEqual(three);
  });

  it("uses all 52 cards exactly once", () => {
    for (const seed of [0, 1, 42, 999999]) {
      const s = deal(seed, 1);
      const cards = allCards(s);
      expect(cards.length).toBe(DECK_SIZE);
      expect(new Set(cards.map((c) => c.id)).size).toBe(DECK_SIZE);
      expect(cardCount(s)).toBe(DECK_SIZE);
    }
  });

  it("puts i+1 cards in column i", () => {
    const s = deal(123, 1);
    expect(s.tableau.length).toBe(TABLEAU_COUNT);
    s.tableau.forEach((col, i) => {
      expect(col.down.length + col.up.length).toBe(i + 1);
    });
  });

  it("leaves exactly one face-up card per column", () => {
    const s = deal(123, 1);
    s.tableau.forEach((col, i) => {
      expect(col.up.length).toBe(1);
      expect(col.down.length).toBe(i);
    });
  });

  it("puts the remaining 24 cards in the stock", () => {
    const s = deal(123, 1);
    expect(s.stock.length).toBe(24);
  });

  it("starts with an empty waste and four empty foundations", () => {
    const s = deal(123, 3);
    expect(s.waste).toEqual([]);
    expect(s.foundations).toEqual([[], [], [], []]);
  });

  it("deals a different board for every seed across a sample", () => {
    const boards = new Set(
      Array.from({ length: 100 }, (_, i) => JSON.stringify(deal(i, 1).tableau)),
    );
    expect(boards.size).toBe(100);
  });
});
