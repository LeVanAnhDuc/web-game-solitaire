import { colorOf, type Card } from "./cards";
import {
  FOUNDATION_SUITS,
  pileIdEquals,
  type FoundationIndex,
  type GameState,
  type PileId,
  type TableauColumn,
  type TableauIndex,
} from "./state";

/**
 * The single source of the rules (invariant #2). Nothing outside this file decides
 * whether a card may go somewhere - the UI asks, it never judges, which is what keeps
 * tap and drag on one rulebook (invariant #6).
 */

export type Move =
  | { readonly type: "draw" }
  | { readonly type: "recycle" }
  | {
      readonly type: "move";
      readonly from: PileId;
      readonly to: PileId;
      readonly count: number;
    };

const FOUNDATION_INDICES: readonly FoundationIndex[] = [0, 1, 2, 3];
const TABLEAU_INDICES: readonly TableauIndex[] = [0, 1, 2, 3, 4, 5, 6];

// ---------------------------------------------------------------------------- reading

/**
 * The card that would land on the destination - the first of the moved run - or
 * undefined when the source cannot give `count` cards at all.
 *
 * No slicing: this runs a few hundred times per position during search, so it answers
 * the question by index instead of by allocating the run.
 */
function liftedCard(s: GameState, from: PileId, count: number): Card | undefined {
  switch (from.kind) {
    // Cards leave the stock only through `draw`, and the waste gives its top card only.
    case "stock":
      return undefined;
    case "waste":
      return count === 1 ? s.waste[s.waste.length - 1] : undefined;
    case "foundation": {
      if (count !== 1) return undefined;
      const pile = s.foundations[from.index];
      return pile[pile.length - 1];
    }
    case "tableau": {
      const up = s.tableau[from.index].up;
      const start = up.length - count;
      if (start < 0) return undefined; // never reaches into the face-down cards
      for (let i = start; i < up.length - 1; i++) {
        const upper = up[i];
        const lower = up[i + 1];
        // Only an already-ordered run travels together.
        if (upper.rank !== lower.rank + 1) return undefined;
        if (colorOf(upper.suit) === colorOf(lower.suit)) return undefined;
      }
      return up[start];
    }
  }
}

/** Whether `to` accepts a run of `count` cards headed by `first`. */
function canReceive(s: GameState, to: PileId, first: Card, count: number): boolean {
  switch (to.kind) {
    // Both only ever receive through `draw` and `recycle`.
    case "stock":
    case "waste":
      return false;
    case "foundation": {
      if (count !== 1) return false;
      if (first.suit !== FOUNDATION_SUITS[to.index]) return false;
      const pile = s.foundations[to.index];
      const top = pile[pile.length - 1];
      return top ? first.rank === top.rank + 1 : first.rank === 1;
    }
    case "tableau": {
      const col = s.tableau[to.index];
      const top = col.up[col.up.length - 1];
      // A column counts as empty only when nothing is face down under it either.
      if (!top) return col.down.length === 0 && first.rank === 13;
      return first.rank === top.rank - 1 && colorOf(first.suit) !== colorOf(top.suit);
    }
  }
}

export function isLegal(s: GameState, m: Move): boolean {
  switch (m.type) {
    case "draw":
      return s.stock.length > 0;
    case "recycle":
      return s.stock.length === 0 && s.waste.length > 0;
    case "move": {
      if (!Number.isInteger(m.count) || m.count < 1) return false;
      if (pileIdEquals(m.from, m.to)) return false;
      const first = liftedCard(s, m.from, m.count);
      return first !== undefined && canReceive(s, m.to, first, m.count);
    }
  }
}

/**
 * Every legal move in this position, including `draw` and `recycle` - the winnability
 * search walks positions through this list, so an omission here makes a solvable deal
 * look dead.
 */
export function legalMoves(s: GameState): Move[] {
  const out: Move[] = [];
  if (s.stock.length > 0) out.push({ type: "draw" });
  else if (s.waste.length > 0) out.push({ type: "recycle" });

  const offer = (from: PileId, first: Card, count: number): void => {
    for (const index of FOUNDATION_INDICES) {
      const to: PileId = { kind: "foundation", index };
      if (!pileIdEquals(from, to) && canReceive(s, to, first, count)) {
        out.push({ type: "move", from, to, count });
      }
    }
    for (const index of TABLEAU_INDICES) {
      const to: PileId = { kind: "tableau", index };
      if (!pileIdEquals(from, to) && canReceive(s, to, first, count)) {
        out.push({ type: "move", from, to, count });
      }
    }
  };

  const wasteTop = s.waste[s.waste.length - 1];
  if (wasteTop) offer({ kind: "waste" }, wasteTop, 1);

  for (const index of FOUNDATION_INDICES) {
    const pile = s.foundations[index];
    const top = pile[pile.length - 1];
    if (top) offer({ kind: "foundation", index }, top, 1);
  }

  for (const index of TABLEAU_INDICES) {
    const up = s.tableau[index].up;
    for (let count = 1; count <= up.length; count++) {
      const start = up.length - count;
      if (count > 1) {
        const upper = up[start];
        const lower = up[start + 1];
        // The run grows one card downwards at a time; once it breaks, so does every
        // longer one, so this stays O(1) per count instead of rescanning the run.
        if (upper.rank !== lower.rank + 1) break;
        if (colorOf(upper.suit) === colorOf(lower.suit)) break;
      }
      offer({ kind: "tableau", index }, up[start], count);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------- writing

function withFoundation(
  s: GameState,
  i: FoundationIndex,
  cards: readonly Card[],
): GameState {
  const foundations = s.foundations.slice();
  foundations[i] = cards;
  return { ...s, foundations };
}

function withColumn(s: GameState, i: TableauIndex, col: TableauColumn): GameState {
  const tableau = s.tableau.slice();
  tableau[i] = col;
  return { ...s, tableau };
}

function removeFrom(s: GameState, from: PileId, count: number): GameState {
  switch (from.kind) {
    case "waste":
      return { ...s, waste: s.waste.slice(0, s.waste.length - count) };
    case "foundation": {
      const pile = s.foundations[from.index];
      return withFoundation(s, from.index, pile.slice(0, pile.length - count));
    }
    case "tableau": {
      const col = s.tableau[from.index];
      let up = col.up.slice(0, col.up.length - count);
      let down = col.down;
      // Exposing the next card is part of the same move, not a move of its own -
      // otherwise undo would need two steps to put one card back.
      if (up.length === 0 && down.length > 0) {
        up = [down[down.length - 1]];
        down = down.slice(0, down.length - 1);
      }
      return withColumn(s, from.index, { down, up });
    }
    case "stock":
      throw new Error("stock never gives cards - isLegal should have refused this");
  }
}

function addTo(s: GameState, to: PileId, cards: readonly Card[]): GameState {
  switch (to.kind) {
    case "foundation":
      return withFoundation(s, to.index, [...s.foundations[to.index], ...cards]);
    case "tableau": {
      const col = s.tableau[to.index];
      return withColumn(s, to.index, { down: col.down, up: [...col.up, ...cards] });
    }
    case "stock":
    case "waste":
      throw new Error("stock and waste never receive - isLegal should have refused this");
  }
}

function liftedRun(s: GameState, from: PileId, count: number): readonly Card[] {
  switch (from.kind) {
    case "waste":
      return s.waste.slice(s.waste.length - count);
    case "foundation": {
      const pile = s.foundations[from.index];
      return pile.slice(pile.length - count);
    }
    case "tableau": {
      const up = s.tableau[from.index].up;
      return up.slice(up.length - count);
    }
    case "stock":
      throw new Error("stock never gives cards - isLegal should have refused this");
  }
}

/**
 * Pure: returns a new state and never touches the one it was given. Undo is a replay
 * of the move history from the seed (ADR-0001), so a single mutation here corrupts
 * every earlier position at once - this is invariant #4, and moves.test.ts freezes its
 * input to keep it honest.
 */
export function applyMove(s: GameState, m: Move): GameState {
  if (!isLegal(s, m)) throw new Error(`Illegal move: ${JSON.stringify(m)}`);

  switch (m.type) {
    case "draw": {
      const n = Math.min(s.drawMode, s.stock.length);
      const taken = s.stock.slice(s.stock.length - n);
      taken.reverse(); // cards come off the top one at a time, so the packet flips
      return {
        ...s,
        stock: s.stock.slice(0, s.stock.length - n),
        waste: [...s.waste, ...taken],
      };
    }
    case "recycle": {
      // Reversed, never reshuffled: turning the waste face-down restores exactly the
      // order the stock had before this pass, which is what makes a deal repeatable.
      const stock = s.waste.slice();
      stock.reverse();
      return { ...s, stock, waste: [] };
    }
    case "move": {
      const run = liftedRun(s, m.from, m.count);
      return addTo(removeFrom(s, m.from, m.count), m.to, run);
    }
  }
}
