import { describe, expect, it } from "vitest";
import { autoCompleteMoves, findAutoTarget } from "./auto";
import { SUITS, cardId, type Card, type Rank, type Suit } from "./cards";
import { deal } from "./deal";
import { applyMove, isLegal, legalMoves, type Move } from "./moves";
import { mulberry32 } from "./rng";
import {
  TABLEAU_COUNT,
  canAutoComplete,
  isWon,
  type GameState,
  type PileId,
  type TableauColumn,
} from "./state";

const card = (suit: Suit, rank: Rank): Card => ({ id: cardId(suit, rank), suit, rank });

const emptyColumns = (): TableauColumn[] =>
  Array.from({ length: TABLEAU_COUNT }, () => ({ down: [], up: [] }));

const blank = (over: Partial<GameState> = {}): GameState => ({
  seed: 1,
  drawMode: 1,
  stock: [],
  waste: [],
  foundations: [[], [], [], []],
  tableau: emptyColumns(),
  ...over,
});

const withColumns = (
  cols: Record<number, TableauColumn>,
  over: Partial<GameState> = {},
): GameState => {
  const tableau = emptyColumns();
  for (const [i, col] of Object.entries(cols)) tableau[Number(i)] = col;
  return blank({ ...over, tableau });
};

const T = (index: 0 | 1 | 2 | 3 | 4 | 5 | 6): PileId => ({ kind: "tableau", index });
const F = (index: 0 | 1 | 2 | 3): PileId => ({ kind: "foundation", index });
const WASTE: PileId = { kind: "waste" };

/** The destination of a suggestion, or null when there was none. */
const targetOf = (m: Move | null): PileId | null =>
  m && m.type === "move" ? m.to : null;

/** Foundations holding ace through the given rank for every suit. */
const foundationsUpTo = (rank: Rank): Card[][] =>
  SUITS.map((suit) =>
    Array.from({ length: rank }, (_, i) => card(suit, (i + 1) as Rank)),
  );

describe("findAutoTarget", () => {
  it("prefers the foundation of the matching suit over any tableau column", () => {
    // The ace of spades fits foundation 0 and also sits nicely on the red two.
    const s = withColumns({
      0: { down: [], up: [card("spades", 1)] },
      1: { down: [], up: [card("hearts", 2)] },
    });
    expect(findAutoTarget(s, T(0))).toEqual({
      type: "move",
      from: T(0),
      to: F(0),
      count: 1,
    });
  });

  it("targets the foundation of the card's own suit, by SUITS order", () => {
    const s = blank({ waste: [card("diamonds", 1)] });
    expect(findAutoTarget(s, WASTE)).toEqual({
      type: "move",
      from: WASTE,
      to: F(2),
      count: 1,
    });
  });

  it("sends a king to the lowest empty column when no foundation will take it", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 13)] },
      1: { down: [], up: [] },
      2: { down: [], up: [] },
    });
    expect(findAutoTarget(s, T(0))).toEqual({
      type: "move",
      from: T(0),
      to: T(1),
      count: 1,
    });
  });

  it("prefers an occupied column over an empty one with a lower index", () => {
    const s = withColumns({
      0: { down: [], up: [] }, // empty, and a lower index than the occupied column
      1: { down: [], up: [card("hearts", 12)] },
      2: { down: [], up: [card("spades", 13)] },
    });
    expect(targetOf(findAutoTarget(s, T(1)))).toEqual(T(2));
  });

  it("picks the lowest occupied column when several would take the card", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 5)] },
      1: { down: [], up: [card("spades", 6)] },
      2: { down: [], up: [card("clubs", 6)] },
    });
    expect(targetOf(findAutoTarget(s, T(0)))).toEqual(T(1));
  });

  it("skips occupied columns that refuse the card, then takes the lowest empty one", () => {
    const s = withColumns({
      0: { down: [card("clubs", 3)], up: [card("hearts", 13)] },
      1: { down: [], up: [card("spades", 5)] }, // occupied, but no king goes on a five
    });
    expect(targetOf(findAutoTarget(s, T(0)))).toEqual(T(2));
  });

  it("returns null when nothing accepts the card", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 5)] },
      1: { down: [], up: [card("diamonds", 6)] }, // same colour, no good
    });
    expect(findAutoTarget(s, T(0))).toBeNull();
  });

  it("returns null for the stock - a tap there is a draw, not a relocation", () => {
    const s = blank({ stock: [card("spades", 1)] });
    expect(findAutoTarget(s, { kind: "stock" })).toBeNull();
  });

  it("returns null for an empty source", () => {
    expect(findAutoTarget(blank(), WASTE)).toBeNull();
    expect(findAutoTarget(blank(), T(0))).toBeNull();
  });

  it("moves a whole run when asked, and then only a tableau can take it", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 8), card("clubs", 7)] },
      1: { down: [], up: [card("spades", 9)] },
    });
    expect(findAutoTarget(s, T(0), 2)).toEqual({
      type: "move",
      from: T(0),
      to: T(1),
      count: 2,
    });
  });

  it("never suggests a move that isLegal rejects, across real deals", () => {
    const pick = mulberry32(31);
    for (let seed = 0; seed < 30; seed++) {
      let s = deal(seed, 3);
      for (let step = 0; step < 20; step++) {
        const sources: PileId[] = [
          { kind: "stock" },
          WASTE,
          ...([0, 1, 2, 3] as const).map(F),
          ...([0, 1, 2, 3, 4, 5, 6] as const).map(T),
        ];
        for (const from of sources) {
          const suggestion = findAutoTarget(s, from);
          if (suggestion) expect(isLegal(s, suggestion)).toBe(true);
        }
        const options = legalMoves(s);
        if (options.length === 0) break;
        s = applyMove(s, options[Math.floor(pick() * options.length)]);
      }
    }
  });
});

describe("autoCompleteMoves", () => {
  it("finishes a board that only needs the queens and kings played", () => {
    const s = withColumns(
      {
        0: { down: [], up: [card("spades", 13), card("spades", 12)] },
        1: { down: [], up: [card("hearts", 13), card("hearts", 12)] },
        2: { down: [], up: [card("diamonds", 13), card("diamonds", 12)] },
        3: { down: [], up: [card("clubs", 13), card("clubs", 12)] },
      },
      { foundations: foundationsUpTo(11) },
    );
    expect(canAutoComplete(s)).toBe(true);

    const moves = autoCompleteMoves(s);
    expect(moves.length).toBe(8);
    const finished = moves.reduce<GameState>(applyMove, s);
    expect(isWon(finished)).toBe(true);
  });

  it("draws through the stock to reach the cards it still needs", () => {
    const s = withColumns(
      {
        0: { down: [], up: [card("hearts", 13), card("hearts", 12)] },
        1: { down: [], up: [card("diamonds", 13), card("diamonds", 12)] },
        2: { down: [], up: [card("clubs", 13), card("clubs", 12)] },
      },
      {
        drawMode: 1,
        foundations: foundationsUpTo(11),
        stock: [card("spades", 13), card("spades", 12)],
      },
    );

    const moves = autoCompleteMoves(s);
    expect(moves.some((m) => m.type === "draw")).toBe(true);
    expect(isWon(moves.reduce<GameState>(applyMove, s))).toBe(true);
  });

  it("plays cards straight off the waste, deepest last", () => {
    const s = blank({
      drawMode: 3,
      foundations: foundationsUpTo(12),
      waste: [
        card("spades", 13),
        card("hearts", 13),
        card("diamonds", 13),
        card("clubs", 13),
      ],
    });

    const moves = autoCompleteMoves(s);
    expect(moves.length).toBe(4);
    expect(isWon(moves.reduce<GameState>(applyMove, s))).toBe(true);
  });

  it("returns only moves that were legal when their turn came", () => {
    const s = withColumns(
      {
        0: { down: [], up: [card("spades", 13), card("spades", 12)] },
        1: { down: [], up: [card("hearts", 13), card("hearts", 12)] },
        2: { down: [], up: [card("diamonds", 13), card("diamonds", 12)] },
        3: { down: [], up: [card("clubs", 13), card("clubs", 12)] },
      },
      { foundations: foundationsUpTo(11) },
    );
    let cur = s;
    for (const move of autoCompleteMoves(s)) {
      expect(isLegal(cur, move)).toBe(true);
      cur = applyMove(cur, move);
    }
  });

  it("stops instead of looping when the position cannot be finished", () => {
    // No ace anywhere, so nothing will ever reach a foundation. The stock can be
    // drawn and recycled forever, which is exactly the loop that must not happen.
    const s = blank({ drawMode: 3, stock: [card("hearts", 5), card("spades", 9)] });
    const moves = autoCompleteMoves(s);
    expect(Array.isArray(moves)).toBe(true);
    expect(moves.length).toBeLessThan(20);
    expect(isWon(moves.reduce<GameState>(applyMove, s))).toBe(false);
  });

  it("returns nothing on a board with no cards left to place", () => {
    expect(autoCompleteMoves(blank())).toEqual([]);
  });

  it("returns nothing on an already won board", () => {
    const won = blank({ foundations: foundationsUpTo(13) });
    expect(isWon(won)).toBe(true);
    expect(autoCompleteMoves(won)).toEqual([]);
  });

  it("does not mutate the state it was given", () => {
    const s = withColumns(
      { 0: { down: [], up: [card("spades", 13), card("spades", 12)] } },
      { foundations: foundationsUpTo(11) },
    );
    const before = JSON.stringify(s);
    autoCompleteMoves(s);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("terminates on every fresh deal, whatever it finds", () => {
    for (let seed = 0; seed < 25; seed++) {
      const moves: Move[] = autoCompleteMoves(deal(seed, 3));
      expect(moves.length).toBeLessThan(500);
    }
  });
});
