import { applyMove, isLegal, type Move } from "./moves";
import {
  isWon,
  type FoundationIndex,
  type GameState,
  type PileId,
  type TableauIndex,
} from "./state";

/**
 * Convenience on top of the rules - never a second rulebook. Everything here proposes
 * moves and hands them back to the caller; only applyMove changes a board, and every
 * proposal is checked by isLegal before it leaves this file (invariants #2 and #6).
 */

const FOUNDATION_INDICES: readonly FoundationIndex[] = [0, 1, 2, 3];
const TABLEAU_INDICES: readonly TableauIndex[] = [0, 1, 2, 3, 4, 5, 6];

function foundationTarget(s: GameState, from: PileId, count: number): Move | null {
  for (const index of FOUNDATION_INDICES) {
    const move: Move = { type: "move", from, to: { kind: "foundation", index }, count };
    if (isLegal(s, move)) return move;
  }
  return null;
}

/**
 * Where a double-tapped card should go (FR-05). The order is fixed rather than
 * "first pile that fits": foundation, then a column that already has cards, then an
 * empty one, lowest index inside each group. Two identical boards therefore always
 * answer the same way, which is what makes the gesture predictable and testable.
 */
export function findAutoTarget(s: GameState, from: PileId, count = 1): Move | null {
  const onFoundation = foundationTarget(s, from, count);
  if (onFoundation) return onFoundation;

  // Filling an empty column is a decision the player may want to keep for a king, so
  // it is the last resort rather than just another candidate.
  for (const empty of [false, true]) {
    for (const index of TABLEAU_INDICES) {
      const col = s.tableau[index];
      if ((col.up.length === 0 && col.down.length === 0) !== empty) continue;
      const move: Move = { type: "move", from, to: { kind: "tableau", index }, count };
      if (isLegal(s, move)) return move;
    }
  }

  return null;
}

/** The next card that can go up to a foundation, columns first, then the waste. */
function nextFoundationMove(s: GameState): Move | null {
  for (const index of TABLEAU_INDICES) {
    if (s.tableau[index].up.length === 0) continue;
    const move = foundationTarget(s, { kind: "tableau", index }, 1);
    if (move) return move;
  }
  if (s.waste.length > 0) return foundationTarget(s, { kind: "waste" }, 1);
  return null;
}

/**
 * The move list that finishes a board nobody needs to think about any more (FR-06).
 * It only proposes: the caller applies the moves one at a time so the player can
 * interrupt the sequence (invariant #9).
 *
 * Termination is the delicate part. Foundation moves are bounded - each one puts a
 * card up for good, at most 52 times - but draw and recycle can cycle forever. So the
 * filler moves are capped at one full pass through stock plus waste: if seeing every
 * remaining card once yields nothing, the position will not progress, and what has
 * been found so far is returned rather than looping.
 */
export function autoCompleteMoves(s: GameState): Move[] {
  const moves: Move[] = [];
  let board = s;
  let sinceProgress = 0;

  while (!isWon(board)) {
    const play = nextFoundationMove(board);
    if (play) {
      moves.push(play);
      board = applyMove(board, play);
      sinceProgress = 0;
      continue;
    }

    const unseen = board.stock.length + board.waste.length;
    if (unseen === 0 || sinceProgress > unseen + 1) break;

    const filler: Move = board.stock.length > 0 ? { type: "draw" } : { type: "recycle" };
    if (!isLegal(board, filler)) break;
    moves.push(filler);
    board = applyMove(board, filler);
    sinceProgress++;
  }

  return moves;
}
