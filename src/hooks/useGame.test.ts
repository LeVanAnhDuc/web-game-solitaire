import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useGame } from "./useGame";
import { cardCount, type PileId } from "@/game/state";

const TABLEAU = (index: 0 | 1 | 2 | 3 | 4 | 5 | 6): PileId => ({ kind: "tableau", index });
const STOCK: PileId = { kind: "stock" };

/**
 * A seed is passed explicitly in every test: without one the hook deals a random game
 * on mount, and a test that depends on the deal would be flaky for a reason that has
 * nothing to do with what it is checking.
 */
const SEED = 12345;

describe("useGame", () => {
  it("deals a full board and is ready when given a seed", () => {
    const { result } = renderHook(() => useGame(SEED));
    expect(result.current.ready).toBe(true);
    expect(result.current.seed).toBe(SEED);
    expect(cardCount(result.current.state)).toBe(52);
    expect(result.current.moveCount).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.won).toBe(false);
  });

  it("plays a legal move and records it in the history", () => {
    const { result } = renderHook(() => useGame(SEED));
    act(() => {
      result.current.playMove({ type: "draw" });
    });
    expect(result.current.moveCount).toBe(1);
    expect(result.current.state.waste.length).toBeGreaterThan(0);
    expect(result.current.canUndo).toBe(true);
  });

  it("rejects an illegal move without touching the history - invariant #7", () => {
    const { result } = renderHook(() => useGame(SEED));
    const before = result.current.state;
    let outcome: string | undefined;
    act(() => {
      // Nothing may ever be moved onto the stock.
      outcome = result.current.play({ from: TABLEAU(0), count: 1, to: STOCK });
    });
    expect(outcome).toBe("rejected");
    expect(result.current.moveCount).toBe(0);
    expect(result.current.state).toBe(before);
  });

  it("undo returns exactly the position before the move", () => {
    const { result } = renderHook(() => useGame(SEED));
    const start = result.current.state;
    act(() => {
      result.current.playMove({ type: "draw" });
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toEqual(start);
    expect(result.current.canUndo).toBe(false);
  });

  it("undo at the start of a game does nothing", () => {
    const { result } = renderHook(() => useGame(SEED));
    act(() => {
      result.current.undo();
    });
    expect(result.current.moveCount).toBe(0);
  });

  it("restart keeps the seed and clears the history", () => {
    const { result } = renderHook(() => useGame(SEED));
    const start = result.current.state;
    act(() => {
      result.current.playMove({ type: "draw" });
      result.current.playMove({ type: "draw" });
    });
    act(() => {
      result.current.restart();
    });
    expect(result.current.seed).toBe(SEED);
    expect(result.current.state).toEqual(start);
  });

  it("newGame changes the seed and clears the history", () => {
    const { result } = renderHook(() => useGame(SEED));
    act(() => {
      result.current.playMove({ type: "draw" });
    });
    act(() => {
      result.current.newGame();
    });
    expect(result.current.seed).not.toBe(SEED);
    expect(result.current.moveCount).toBe(0);
  });

  it("changing draw mode redeals with the new mode", () => {
    const { result } = renderHook(() => useGame(SEED));
    act(() => {
      result.current.playMove({ type: "draw" });
    });
    expect(result.current.state.waste.length).toBe(1);
    act(() => {
      result.current.setDrawMode(3);
    });
    expect(result.current.drawMode).toBe(3);
    expect(result.current.moveCount).toBe(0);
    act(() => {
      result.current.playMove({ type: "draw" });
    });
    expect(result.current.state.waste.length).toBe(3);
  });

  it("deals a random game on mount when no seed is given", () => {
    const { result } = renderHook(() => useGame());
    expect(result.current.ready).toBe(true);
    expect(cardCount(result.current.state)).toBe(52);
  });
});
