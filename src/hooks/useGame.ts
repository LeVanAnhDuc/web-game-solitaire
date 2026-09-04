"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { randomSeed } from "@/game/rng";
import { deal } from "@/game/deal";
import { applyMove, isLegal, type Move } from "@/game/moves";
import { canAutoComplete, isWon, type DrawMode, type GameState } from "@/game/state";
import { readSeedFromUrl, writeSeedToUrl } from "@/lib/seedUrl";
import type { MoveIntent } from "./moveIntent";

/**
 * The whole game is a seed plus the moves played on it (ADR-0001). The current
 * position is that list replayed from the deal, so undo, restart and a reproducible
 * test are all the same mechanism and there is no inverse of applyMove to keep in
 * sync with applyMove itself.
 */
type Session = {
  readonly seed: number;
  readonly drawMode: DrawMode;
  readonly history: readonly Move[];
  /** False until the client has dealt a random game - see the note on SSR below. */
  readonly ready: boolean;
};

type Action =
  | { type: "play"; move: Move }
  | { type: "undo" }
  | { type: "restart" }
  | { type: "newGame"; seed: number }
  | { type: "setDrawMode"; drawMode: DrawMode };

/**
 * The page is prerendered at build time, so a random deal chosen during render would
 * either ship the same game to everyone or break hydration. The build renders this
 * fixed seed, and the client deals a real one on mount; `ready` is what tells the
 * board not to show the placeholder deal in the meantime.
 */
const SSR_SEED = 1;

function reduce(s: Session, a: Action): Session {
  switch (a.type) {
    case "play":
      return { ...s, history: [...s.history, a.move] };
    case "undo":
      return s.history.length === 0 ? s : { ...s, history: s.history.slice(0, -1) };
    case "restart":
      return { ...s, history: [] };
    case "newGame":
      return { ...s, seed: a.seed, history: [], ready: true };
    case "setDrawMode":
      // Draw mode is baked into the deal, so changing it necessarily starts over.
      // The confirmation belongs to the UI; by the time this runs it has been given.
      return { ...s, drawMode: a.drawMode, history: [] };
  }
}

export type PlayResult = "ok" | "rejected";

export type UseGame = {
  state: GameState;
  seed: number;
  drawMode: DrawMode;
  moveCount: number;
  ready: boolean;
  canUndo: boolean;
  won: boolean;
  autoCompleteAvailable: boolean;
  /** Judges an intent and plays it if legal. A rejected intent leaves history alone. */
  play: (intent: MoveIntent) => PlayResult;
  /** For moves that are not pile-to-pile: drawing, recycling, auto-complete steps. */
  playMove: (move: Move) => PlayResult;
  undo: () => void;
  restart: () => void;
  newGame: () => void;
  setDrawMode: (drawMode: DrawMode) => void;
};

export function useGame(initialSeed?: number): UseGame {
  const [session, dispatch] = useReducer(reduce, {
    seed: initialSeed ?? SSR_SEED,
    drawMode: 1 as DrawMode,
    history: [],
    ready: initialSeed !== undefined,
  });

  useEffect(() => {
    if (initialSeed !== undefined) return;
    // A deal number in the address wins over a random one (FR-13); the effect is also
    // where the random seed is drawn, because a seed chosen during render would be
    // baked into the prerendered HTML.
    const seed = readSeedFromUrl(window.location.search) ?? randomSeed();
    dispatch({ type: "newGame", seed });
    // Deliberately once, on mount: a later re-run would re-deal under the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session.ready) writeSeedToUrl(session.seed);
  }, [session.ready, session.seed]);

  const state = useMemo(
    () =>
      session.history.reduce<GameState>(
        (acc, move) => applyMove(acc, move),
        deal(session.seed, session.drawMode),
      ),
    [session.seed, session.drawMode, session.history],
  );

  const playMove = useCallback(
    (move: Move): PlayResult => {
      if (!isLegal(state, move)) return "rejected";
      dispatch({ type: "play", move });
      return "ok";
    },
    [state],
  );

  const play = useCallback(
    (intent: MoveIntent): PlayResult =>
      playMove({ type: "move", from: intent.from, to: intent.to, count: intent.count }),
    [playMove],
  );

  return {
    state,
    seed: session.seed,
    drawMode: session.drawMode,
    moveCount: session.history.length,
    ready: session.ready,
    canUndo: session.history.length > 0,
    won: isWon(state),
    autoCompleteAvailable: canAutoComplete(state),
    play,
    playMove,
    undo: useCallback(() => dispatch({ type: "undo" }), []),
    restart: useCallback(() => dispatch({ type: "restart" }), []),
    newGame: useCallback(() => dispatch({ type: "newGame", seed: randomSeed() }), []),
    setDrawMode: useCallback(
      (drawMode: DrawMode) => dispatch({ type: "setDrawMode", drawMode }),
      [],
    ),
  };
}
