import { describe, expect, it } from "vitest";
import { cardId, type Card, type Rank, type Suit } from "./cards";
import { deal } from "./deal";
import { applyMove, isLegal, legalMoves, type Move } from "./moves";
import { mulberry32 } from "./rng";
import {
  TABLEAU_COUNT,
  cardCount,
  type DrawMode,
  type GameState,
  type PileId,
  type TableauColumn,
} from "./state";

const card = (suit: Suit, rank: Rank): Card => ({ id: cardId(suit, rank), suit, rank });

const emptyColumns = (): TableauColumn[] =>
  Array.from({ length: TABLEAU_COUNT }, () => ({ down: [], up: [] }));

/** A board with nothing on it, so each test states only the cards its rule needs. */
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

/**
 * Freezing recursively turns any mutation of the argument into a thrown TypeError -
 * test files are ESM and therefore strict mode. This is the guard for invariant #4.
 */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const inner of Object.values(value as Record<string, unknown>))
      deepFreeze(inner);
  }
  return value;
}

const T = (index: 0 | 1 | 2 | 3 | 4 | 5 | 6): PileId => ({ kind: "tableau", index });
const F = (index: 0 | 1 | 2 | 3): PileId => ({ kind: "foundation", index });
const WASTE: PileId = { kind: "waste" };
const STOCK: PileId = { kind: "stock" };

const mv = (from: PileId, to: PileId, count = 1): Move => ({
  type: "move",
  from,
  to,
  count,
});

// --------------------------------------------------------------- isLegal: draw / recycle

describe("isLegal - draw", () => {
  it("is legal while the stock has cards", () => {
    expect(isLegal(blank({ stock: [card("spades", 1)] }), { type: "draw" })).toBe(true);
  });

  it("is illegal on an empty stock", () => {
    expect(isLegal(blank(), { type: "draw" })).toBe(false);
  });
});

describe("isLegal - recycle", () => {
  it("is legal when the stock is empty and the waste is not", () => {
    expect(isLegal(blank({ waste: [card("spades", 1)] }), { type: "recycle" })).toBe(
      true,
    );
  });

  it("is illegal while the stock still has cards", () => {
    const s = blank({ stock: [card("hearts", 2)], waste: [card("spades", 1)] });
    expect(isLegal(s, { type: "recycle" })).toBe(false);
  });

  it("is illegal when the waste is empty too", () => {
    expect(isLegal(blank(), { type: "recycle" })).toBe(false);
  });
});

// ----------------------------------------------------------- isLegal: destination table

describe("isLegal - destination foundation[i]", () => {
  it("accepts the ace of its own suit onto an empty pile", () => {
    const s = blank({ waste: [card("spades", 1)] });
    expect(isLegal(s, mv(WASTE, F(0)))).toBe(true);
  });

  it("rejects a non-ace onto an empty pile", () => {
    const s = blank({ waste: [card("spades", 2)] });
    expect(isLegal(s, mv(WASTE, F(0)))).toBe(false);
  });

  it("rejects the right rank in the wrong suit - foundation i is SUITS[i]", () => {
    const s = blank({ waste: [card("hearts", 1)] });
    expect(isLegal(s, mv(WASTE, F(0)))).toBe(false);
    expect(isLegal(s, mv(WASTE, F(1)))).toBe(true);
  });

  it("accepts exactly one rank above the top card", () => {
    const s = blank({
      waste: [card("spades", 3)],
      foundations: [[card("spades", 2)], [], [], []],
    });
    expect(isLegal(s, mv(WASTE, F(0)))).toBe(true);
  });

  it("rejects a rank that skips, repeats or goes backwards", () => {
    const base = { foundations: [[card("spades", 5)], [], [], []] };
    const higher = blank({ ...base, waste: [card("spades", 7)] });
    const same = blank({ ...base, waste: [card("spades", 5)] });
    const lower = blank({ ...base, waste: [card("spades", 4)] });
    expect(isLegal(higher, mv(WASTE, F(0)))).toBe(false);
    expect(isLegal(same, mv(WASTE, F(0)))).toBe(false);
    expect(isLegal(lower, mv(WASTE, F(0)))).toBe(false);
  });

  it("never takes more than one card at a time", () => {
    const s = withColumns({
      0: { down: [], up: [card("spades", 2), card("spades", 1)] },
    });
    expect(isLegal(s, mv(T(0), F(0), 2))).toBe(false);
  });
});

describe("isLegal - destination empty tableau column", () => {
  it("accepts a run that starts with a king", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 13), card("spades", 12)] },
    });
    expect(isLegal(s, mv(T(0), T(1), 2))).toBe(true);
  });

  it("rejects a run that starts with anything else", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 12), card("spades", 11)] },
    });
    expect(isLegal(s, mv(T(0), T(1), 2))).toBe(false);
  });
});

describe("isLegal - destination non-empty tableau column", () => {
  const target: TableauColumn = { down: [], up: [card("spades", 9)] };

  it("accepts one rank lower in the other colour", () => {
    const s = withColumns({ 0: { down: [], up: [card("hearts", 8)] }, 1: target });
    expect(isLegal(s, mv(T(0), T(1)))).toBe(true);
  });

  it("rejects the same colour", () => {
    const s = withColumns({ 0: { down: [], up: [card("clubs", 8)] }, 1: target });
    expect(isLegal(s, mv(T(0), T(1)))).toBe(false);
  });

  it("rejects the wrong rank even in the right colour", () => {
    const lower = withColumns({ 0: { down: [], up: [card("hearts", 7)] }, 1: target });
    const higher = withColumns({ 0: { down: [], up: [card("hearts", 10)] }, 1: target });
    expect(isLegal(lower, mv(T(0), T(1)))).toBe(false);
    expect(isLegal(higher, mv(T(0), T(1)))).toBe(false);
  });

  it("judges the run by its FIRST card, not its last", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 8), card("clubs", 7), card("diamonds", 6)] },
      1: target,
    });
    expect(isLegal(s, mv(T(0), T(1), 3))).toBe(true);
    expect(isLegal(s, mv(T(0), T(1), 1))).toBe(false);
  });
});

describe("isLegal - waste and stock never receive", () => {
  it("rejects anything moved onto the waste", () => {
    const s = withColumns(
      { 0: { down: [], up: [card("hearts", 5)] } },
      { waste: [card("spades", 6)] },
    );
    expect(isLegal(s, mv(T(0), WASTE))).toBe(false);
  });

  it("rejects anything moved onto the stock", () => {
    const s = blank({ waste: [card("spades", 6)], stock: [card("hearts", 5)] });
    expect(isLegal(s, mv(WASTE, STOCK))).toBe(false);
  });
});

// ---------------------------------------------------------------- isLegal: source table

describe("isLegal - source waste", () => {
  it("gives its top card", () => {
    const s = blank({ waste: [card("hearts", 9), card("spades", 1)] });
    expect(isLegal(s, mv(WASTE, F(0)))).toBe(true);
  });

  it("never gives two cards at once", () => {
    const s = blank({ waste: [card("spades", 2), card("spades", 1)] });
    expect(isLegal(s, mv(WASTE, T(0), 2))).toBe(false);
  });

  it("gives nothing when empty", () => {
    expect(isLegal(blank(), mv(WASTE, T(0)))).toBe(false);
  });
});

describe("isLegal - source foundation", () => {
  it("gives its top card back to the tableau", () => {
    const s = withColumns(
      { 0: { down: [], up: [card("spades", 3)] } },
      { foundations: [[], [card("hearts", 2)], [], []] },
    );
    expect(isLegal(s, mv(F(1), T(0)))).toBe(true);
  });

  it("never gives two cards at once", () => {
    const s = withColumns(
      { 0: { down: [], up: [card("spades", 4)] } },
      { foundations: [[], [card("hearts", 2), card("hearts", 3)], [], []] },
    );
    expect(isLegal(s, mv(F(1), T(0), 2))).toBe(false);
  });

  it("gives nothing when empty", () => {
    const s = withColumns({ 0: { down: [], up: [card("spades", 3)] } });
    expect(isLegal(s, mv(F(1), T(0)))).toBe(false);
  });
});

describe("isLegal - source tableau", () => {
  const target: TableauColumn = { down: [], up: [card("spades", 9)] };

  it("gives the last count face-up cards when they form a proper run", () => {
    const s = withColumns({
      0: { down: [card("clubs", 2)], up: [card("hearts", 8), card("clubs", 7)] },
      1: target,
    });
    expect(isLegal(s, mv(T(0), T(1), 2))).toBe(true);
  });

  it("refuses a run that is not descending and alternating", () => {
    const sameColour = withColumns({
      0: { down: [], up: [card("hearts", 8), card("diamonds", 7)] },
      1: target,
    });
    const rankGap = withColumns({
      0: { down: [], up: [card("hearts", 8), card("clubs", 5)] },
      1: target,
    });
    expect(isLegal(sameColour, mv(T(0), T(1), 2))).toBe(false);
    expect(isLegal(rankGap, mv(T(0), T(1), 2))).toBe(false);
  });

  it("cannot reach into the face-down cards", () => {
    const s = withColumns({
      0: { down: [card("clubs", 10)], up: [card("hearts", 8)] },
      1: target,
    });
    expect(isLegal(s, mv(T(0), T(1), 2))).toBe(false);
  });

  it("gives nothing when empty", () => {
    const s = withColumns({ 1: { down: [], up: [card("hearts", 13)] } });
    expect(isLegal(s, mv(T(0), T(1)))).toBe(false);
  });
});

describe("isLegal - source stock", () => {
  it("never gives a card - only draw moves cards out of the stock", () => {
    const s = blank({ stock: [card("spades", 1)] });
    expect(isLegal(s, mv(STOCK, F(0)))).toBe(false);
    expect(isLegal(s, mv(STOCK, T(0)))).toBe(false);
  });
});

describe("isLegal - shape of the move itself", () => {
  it("rejects a move whose source is its destination", () => {
    const s = withColumns({ 0: { down: [], up: [card("hearts", 13)] } });
    expect(isLegal(s, mv(T(0), T(0)))).toBe(false);
    expect(isLegal(blank({ waste: [card("spades", 1)] }), mv(WASTE, WASTE))).toBe(false);
  });

  it("rejects a count below 1 or a fractional count", () => {
    const s = withColumns({ 0: { down: [], up: [card("hearts", 13)] } });
    expect(isLegal(s, mv(T(0), T(1), 0))).toBe(false);
    expect(isLegal(s, mv(T(0), T(1), -1))).toBe(false);
    expect(isLegal(s, mv(T(0), T(1), 1.5))).toBe(false);
  });
});

// -------------------------------------------------------------------------- applyMove

describe("applyMove - purity", () => {
  it("does not mutate a deeply frozen state (invariant #4, ADR-0001)", () => {
    const s = deepFreeze(deal(2026, 3));
    const after = applyMove(s, { type: "draw" });
    expect(after).not.toBe(s);
    expect(s.waste).toEqual([]);
    expect(s.stock.length).toBe(24);
  });

  it("does not mutate on a tableau move that flips a card", () => {
    const s = deepFreeze(
      withColumns({
        0: { down: [card("clubs", 4)], up: [card("hearts", 13)] },
        1: { down: [], up: [] },
      }),
    );
    const after = applyMove(s, mv(T(0), T(1)));
    expect(s.tableau[0].down.length).toBe(1);
    expect(s.tableau[0].up.length).toBe(1);
    expect(after.tableau[1].up.map((c) => c.id)).toEqual(["hearts-13"]);
  });

  it("does not mutate on a foundation move or a recycle", () => {
    const s = deepFreeze(
      withColumns(
        { 0: { down: [], up: [card("spades", 1)] } },
        { waste: [card("hearts", 4)], drawMode: 3 },
      ),
    );
    applyMove(s, mv(T(0), F(0)));
    applyMove(s, { type: "recycle" });
    expect(s.foundations[0]).toEqual([]);
    expect(s.waste.map((c) => c.id)).toEqual(["hearts-4"]);
  });

  it("never creates or loses a card", () => {
    let s = deal(5150, 3);
    for (let i = 0; i < 60; i++) {
      const options = legalMoves(s);
      if (options.length === 0) break;
      s = applyMove(s, options[i % options.length]);
      expect(cardCount(s)).toBe(52);
    }
  });

  it("throws on an illegal move rather than returning a broken board", () => {
    expect(() => applyMove(blank(), { type: "draw" })).toThrow();
    expect(() => applyMove(blank(), { type: "recycle" })).toThrow();
    expect(() => applyMove(blank(), mv(WASTE, F(0)))).toThrow();
  });
});

describe("applyMove - draw", () => {
  it("moves drawMode cards, top of stock first", () => {
    const s = blank({
      drawMode: 3,
      stock: [card("spades", 1), card("hearts", 2), card("diamonds", 3)],
    });
    const after = applyMove(s, { type: "draw" });
    expect(after.stock).toEqual([]);
    // diamonds-3 was on top so it left first and ended up deepest in the waste.
    expect(after.waste.map((c) => c.id)).toEqual(["diamonds-3", "hearts-2", "spades-1"]);
  });

  it("takes only what is left when the stock is short", () => {
    const s = blank({ drawMode: 3, stock: [card("spades", 1), card("hearts", 2)] });
    const after = applyMove(s, { type: "draw" });
    expect(after.stock).toEqual([]);
    expect(after.waste.length).toBe(2);
  });

  it("moves one card in draw-1 mode", () => {
    const s = blank({ drawMode: 1, stock: [card("spades", 1), card("hearts", 2)] });
    const after = applyMove(s, { type: "draw" });
    expect(after.stock.map((c) => c.id)).toEqual(["spades-1"]);
    expect(after.waste.map((c) => c.id)).toEqual(["hearts-2"]);
  });

  it("keeps the cards already on the waste underneath", () => {
    const s = blank({
      drawMode: 1,
      stock: [card("spades", 1)],
      waste: [card("clubs", 6)],
    });
    const after = applyMove(s, { type: "draw" });
    expect(after.waste.map((c) => c.id)).toEqual(["clubs-6", "spades-1"]);
  });
});

describe("applyMove - recycle", () => {
  const three = [card("spades", 1), card("hearts", 2), card("diamonds", 3)];

  it("sends the whole waste back reversed, without reshuffling", () => {
    const s = blank({ waste: three });
    const after = applyMove(s, { type: "recycle" });
    expect(after.waste).toEqual([]);
    expect(after.stock.map((c) => c.id)).toEqual(["diamonds-3", "hearts-2", "spades-1"]);
  });

  it("round-trips: drawing the whole stock then recycling restores the original order", () => {
    let s: GameState = blank({ drawMode: 1, stock: three });
    s = applyMove(s, { type: "draw" });
    s = applyMove(s, { type: "draw" });
    s = applyMove(s, { type: "draw" });
    s = applyMove(s, { type: "recycle" });
    expect(s.stock.map((c) => c.id)).toEqual(three.map((c) => c.id));
  });

  it("can be repeated any number of times (no pass limit)", () => {
    let s: GameState = blank({ drawMode: 3, stock: three });
    for (let pass = 0; pass < 5; pass++) {
      s = applyMove(s, { type: "draw" });
      expect(s.stock).toEqual([]);
      s = applyMove(s, { type: "recycle" });
      expect(s.stock.map((c) => c.id)).toEqual(three.map((c) => c.id));
    }
  });
});

describe("applyMove - the flip rule", () => {
  it("turns the top face-down card up once the face-up run is gone", () => {
    const s = withColumns({
      0: { down: [card("clubs", 4), card("diamonds", 10)], up: [card("hearts", 13)] },
      1: { down: [], up: [] },
    });
    const after = applyMove(s, mv(T(0), T(1)));
    expect(after.tableau[0].up.map((c) => c.id)).toEqual(["diamonds-10"]);
    expect(after.tableau[0].down.map((c) => c.id)).toEqual(["clubs-4"]);
  });

  it("leaves the column empty when there was nothing face down", () => {
    const s = withColumns({
      0: { down: [], up: [card("hearts", 13)] },
      1: { down: [], up: [] },
    });
    const after = applyMove(s, mv(T(0), T(1)));
    expect(after.tableau[0]).toEqual({ down: [], up: [] });
  });

  it("flips nothing while face-up cards remain", () => {
    const s = withColumns({
      0: { down: [card("clubs", 4)], up: [card("hearts", 13), card("spades", 12)] },
      1: { down: [], up: [card("diamonds", 13)] },
    });
    const after = applyMove(s, mv(T(0), T(1)));
    expect(after.tableau[0].up.map((c) => c.id)).toEqual(["hearts-13"]);
    expect(after.tableau[0].down.map((c) => c.id)).toEqual(["clubs-4"]);
  });

  it("flips after a move to a foundation as well", () => {
    const s = withColumns({ 0: { down: [card("clubs", 4)], up: [card("spades", 1)] } });
    const after = applyMove(s, mv(T(0), F(0)));
    expect(after.tableau[0]).toEqual({ down: [], up: [card("clubs", 4)] });
    expect(after.foundations[0].map((c) => c.id)).toEqual(["spades-1"]);
  });
});

// -------------------------------------------------------------------------- legalMoves

/** Every move the rules could conceivably be asked about, legal or not. */
function allCandidateMoves(): Move[] {
  const piles: PileId[] = [
    STOCK,
    WASTE,
    ...([0, 1, 2, 3] as const).map(F),
    ...([0, 1, 2, 3, 4, 5, 6] as const).map(T),
  ];
  const out: Move[] = [{ type: "draw" }, { type: "recycle" }];
  for (const from of piles) {
    for (const to of piles) {
      for (let count = 1; count <= 13; count++) out.push(mv(from, to, count));
    }
  }
  return out;
}

const moveKey = (m: Move): string =>
  m.type === "move"
    ? `move:${JSON.stringify(m.from)}>${JSON.stringify(m.to)}x${m.count}`
    : m.type;

describe("legalMoves", () => {
  const boards: GameState[] = [deal(1, 1), deal(2, 3), deal(3, 1)];

  it("returns only moves that isLegal agrees with", () => {
    for (const board of boards) {
      for (const m of legalMoves(board)) expect(isLegal(board, m)).toBe(true);
    }
  });

  it("misses none - it equals brute force filtered by isLegal", () => {
    const candidates = allCandidateMoves();
    let s = deal(31337, 3);
    for (let step = 0; step < 40; step++) {
      const expected = new Set(candidates.filter((m) => isLegal(s, m)).map(moveKey));
      const actual = new Set(legalMoves(s).map(moveKey));
      expect(actual).toEqual(expected);
      const options = legalMoves(s);
      if (options.length === 0) break;
      s = applyMove(s, options[step % options.length]);
    }
  });

  it("returns no duplicates", () => {
    for (const board of boards) {
      const keys = legalMoves(board).map(moveKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("offers draw and recycle - the search script depends on both being listed", () => {
    expect(legalMoves(deal(9, 1)).some((m) => m.type === "draw")).toBe(true);
    const emptyStock = blank({ waste: [card("spades", 5)] });
    expect(legalMoves(emptyStock).some((m) => m.type === "recycle")).toBe(true);
  });
});

// ------------------------------------------------------ the replay property (ADR-0001)

describe("replay from the seed", () => {
  it("reaches the same state as playing the moves directly, for 200 seeds", () => {
    for (let seed = 0; seed < 200; seed++) {
      const drawMode: DrawMode = seed % 2 === 0 ? 1 : 3;
      const pick = mulberry32(seed + 1_000_003); // seeded, so the test itself is fixed
      const history: Move[] = [];
      // Every state is frozen as it is produced, so a later applyMove that mutated one
      // of them would throw here instead of silently corrupting undo.
      let direct = deepFreeze(deal(seed, drawMode));

      for (let i = 0; i < 30; i++) {
        const options = legalMoves(direct);
        if (options.length === 0) break;
        const move = options[Math.floor(pick() * options.length)];
        history.push(move);
        direct = deepFreeze(applyMove(direct, move));
      }

      expect(history.length).toBe(30);
      const replayed = history.reduce<GameState>(applyMove, deal(seed, drawMode));
      expect(replayed).toEqual(direct);
      expect(cardCount(replayed)).toBe(52);
    }
  });

  it("undo by replaying a shorter history returns the earlier board exactly", () => {
    const pick = mulberry32(4);
    const history: Move[] = [];
    const boards: GameState[] = [deal(808, 1)];
    let s = boards[0];
    for (let i = 0; i < 25; i++) {
      const options = legalMoves(s);
      const move = options[Math.floor(pick() * options.length)];
      history.push(move);
      s = applyMove(s, move);
      boards.push(s);
    }
    for (let n = 0; n <= history.length; n++) {
      const replayed = history.slice(0, n).reduce<GameState>(applyMove, deal(808, 1));
      expect(replayed).toEqual(boards[n]);
    }
  });
});

describe("NFR-PERF-06", () => {
  it("replays 300 moves in under 16ms", () => {
    const seed = 4242;
    const drawMode: DrawMode = 3;
    const pick = mulberry32(11);
    const history: Move[] = [];
    let s = deal(seed, drawMode);
    while (history.length < 300) {
      const options = legalMoves(s);
      if (options.length === 0) break;
      const move = options[Math.floor(pick() * options.length)];
      history.push(move);
      s = applyMove(s, move);
    }
    expect(history.length).toBe(300);

    // Best of five: the point is the order of magnitude, not one noisy sample.
    let best = Number.POSITIVE_INFINITY;
    for (let run = 0; run < 5; run++) {
      const started = performance.now();
      history.reduce<GameState>(applyMove, deal(seed, drawMode));
      best = Math.min(best, performance.now() - started);
    }
    expect(best).toBeLessThan(16);
  });
});
