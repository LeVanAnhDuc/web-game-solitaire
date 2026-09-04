"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "@/game/cards";
import { autoCompleteMoves, findAutoTarget } from "@/game/auto";
import {
  FOUNDATION_SUITS,
  cardsOf,
  pileKey,
  type DrawMode,
  type FoundationIndex,
  type GameState,
  type PileId,
  type TableauIndex,
} from "@/game/state";
import { useGame } from "@/hooks/useGame";
import { useSelection, type DragSource } from "@/hooks/useSelection";
import type { MoveIntent } from "@/hooks/moveIntent";
import { strings } from "@/lib/strings";
import { CardView } from "./CardView";
import { PileView } from "./PileView";
import { Toolbar } from "./Toolbar";
import { WinOverlay } from "./WinOverlay";

/**
 * The board: the only place that knows how the piles are arranged, how the keyboard
 * walks between them, and how an auto-complete run is paced. It holds no rules - every
 * question about legality goes to useGame, which asks the engine.
 */

const STOCK: PileId = { kind: "stock" };
const WASTE: PileId = { kind: "waste" };
const FOUNDATIONS: PileId[] = [0, 1, 2, 3].map((i) => ({
  kind: "foundation",
  index: i as FoundationIndex,
}));
const TABLEAU: PileId[] = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
  kind: "tableau",
  index: i as TableauIndex,
}));

/** Two rows, and the keyboard walks along them. Matches the visual layout exactly. */
const ROWS: PileId[][] = [[STOCK, WASTE, ...FOUNDATIONS], TABLEAU];

const ALL_PILES = ROWS.flat();

/** Long enough to see a card land, short enough not to feel like waiting. */
const AUTO_STEP_MS = 110;
const REJECT_FLASH_MS = 420;

function labelFor(pile: PileId): string {
  switch (pile.kind) {
    case "stock":
      return strings.pile.stock;
    case "waste":
      return strings.pile.waste;
    case "foundation":
      return strings.pile.foundation(FOUNDATION_SUITS[pile.index]!);
    case "tableau":
      return strings.pile.tableau(pile.index);
  }
}

/** How many face-down cards a pile shows: only tableau columns hide anything. */
function faceDownCountOf(state: GameState, pile: PileId): number {
  if (pile.kind === "tableau") return state.tableau[pile.index]?.down.length ?? 0;
  return pile.kind === "stock" ? state.stock.length : 0;
}

export function GameBoard() {
  const game = useGame();
  const [rejected, setRejected] = useState<string | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [pendingDrawMode, setPendingDrawMode] = useState<DrawMode | null>(null);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [focus, setFocus] = useState<{ row: number; col: number }>({ row: 1, col: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const flashReject = useCallback((pile: PileId) => {
    setRejected(pileKey(pile));
    window.setTimeout(() => setRejected(null), REJECT_FLASH_MS);
  }, []);

  const stopAuto = useCallback(() => setAutoRunning(false), []);

  const handleIntent = useCallback(
    (intent: MoveIntent) => {
      stopAuto();
      if (game.play(intent) === "rejected") flashReject(intent.to);
    },
    [game, flashReject, stopAuto],
  );

  const pileByKey = useCallback(
    (key: string) => ALL_PILES.find((p) => pileKey(p) === key) ?? null,
    [],
  );

  const selection = useSelection(handleIntent, pileByKey);

  /**
   * Auto-complete re-asks the engine for the next move on every tick rather than
   * running a precomputed list. That is what makes it cancellable: the moment the
   * player touches anything, autoRunning goes false and the sequence simply stops
   * (invariant #9).
   */
  useEffect(() => {
    if (!autoRunning) return;
    const next = autoCompleteMoves(game.state)[0];
    if (!next) {
      setAutoRunning(false);
      return;
    }
    const id = window.setTimeout(() => game.playMove(next), AUTO_STEP_MS);
    return () => window.clearTimeout(id);
  }, [autoRunning, game]);

  useEffect(() => {
    if (game.won) setAutoRunning(false);
  }, [game.won]);

  /** Roving tabindex: only move focus once the player has actually used the keyboard,
   *  so loading the page does not steal focus from wherever the browser put it. */
  useEffect(() => {
    if (!keyboardActive) return;
    const pile = ROWS[focus.row]?.[focus.col];
    if (!pile) return;
    boardRef.current
      ?.querySelector<HTMLElement>(`[data-pile="${pileKey(pile)}"]`)
      ?.focus({ preventScroll: true });
  }, [focus, keyboardActive]);

  const focusedPile = ROWS[focus.row]?.[focus.col] ?? TABLEAU[0]!;

  const tapStock = useCallback(() => {
    stopAuto();
    selection.clear();
    game.playMove(game.state.stock.length > 0 ? { type: "draw" } : { type: "recycle" });
  }, [game, selection, stopAuto]);

  /**
   * Tapping the stock while holding a card is an attempt to put it there, and the
   * stock accepts nothing (design.md section 1) - so it is refused, visibly, rather
   * than quietly turning into a draw. Drawing is what an empty hand means.
   */
  const tapOrDropOnStock = useCallback(() => {
    if (selection.selection.kind !== "idle") selection.dropOn(STOCK);
    else tapStock();
  }, [selection, tapStock]);

  const autoMoveFrom = useCallback(
    (from: PileId, count: number) => {
      stopAuto();
      const move = findAutoTarget(game.state, from, count);
      if (move) game.playMove(move);
      else flashReject(from);
      selection.clear();
    },
    [game, selection, stopAuto, flashReject],
  );

  /** The source a card represents: itself plus everything stacked on top of it. */
  const sourceAt = useCallback(
    (pile: PileId, index: number): DragSource | null => {
      const cards = cardsOf(game.state, pile);
      const card = cards[index];
      if (!card) return null;
      if (index < faceDownCountOf(game.state, pile)) return null;
      const count = pile.kind === "tableau" ? cards.length - index : 1;
      if (pile.kind !== "tableau" && index !== cards.length - 1) return null;
      return { from: pile, count, cardId: card.id };
    },
    [game.state],
  );

  const onBoardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const held = selection.selection;
      const rowLength = ROWS[focus.row]?.length ?? 1;
      let handled = true;

      switch (e.key) {
        case "ArrowLeft":
          setFocus((f) => ({ ...f, col: (f.col - 1 + rowLength) % rowLength }));
          break;
        case "ArrowRight":
          setFocus((f) => ({ ...f, col: (f.col + 1) % rowLength }));
          break;
        case "ArrowUp":
        case "ArrowDown": {
          // While holding a run from a tableau column, up and down change how deep the
          // grab goes. Idle, they switch rows. The hint text says so.
          if (held.kind === "selected" && held.from.kind === "tableau") {
            const cards = cardsOf(game.state, held.from);
            const down = faceDownCountOf(game.state, held.from);
            const maxCount = cards.length - down;
            const next = held.count + (e.key === "ArrowUp" ? 1 : -1);
            const count = Math.min(Math.max(next, 1), Math.max(maxCount, 1));
            const card = cards[cards.length - count];
            if (card) selection.selectSource({ from: held.from, count, cardId: card.id });
          } else {
            setFocus((f) => {
              const row = f.row === 0 ? 1 : 0;
              return { row, col: Math.min(f.col, (ROWS[row]?.length ?? 1) - 1) };
            });
          }
          break;
        }
        case " ":
        case "Spacebar": {
          if (focusedPile.kind === "stock") {
            tapOrDropOnStock();
            break;
          }
          if (held.kind === "idle") {
            const cards = cardsOf(game.state, focusedPile);
            const source = sourceAt(focusedPile, cards.length - 1);
            if (source) selection.selectSource(source);
            else flashReject(focusedPile);
          } else {
            selection.dropOn(focusedPile);
          }
          break;
        }
        case "Enter": {
          if (held.kind !== "idle") autoMoveFrom(held.from, held.count);
          else {
            const cards = cardsOf(game.state, focusedPile);
            const source = sourceAt(focusedPile, cards.length - 1);
            if (source) autoMoveFrom(source.from, source.count);
          }
          break;
        }
        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        setKeyboardActive(true);
        stopAuto();
      }
    },
    [
      focus.row,
      focusedPile,
      game.state,
      selection,
      sourceAt,
      tapOrDropOnStock,
      autoMoveFrom,
      flashReject,
      stopAuto,
    ],
  );

  const wonCards: readonly Card[] = useMemo(
    () => game.state.foundations.flatMap((f) => [...f]),
    [game.state.foundations],
  );

  const pileProps = (pile: PileId) => {
    const cards = game.ready ? cardsOf(game.state, pile) : [];
    return {
      pileId: pile,
      cards,
      faceDownCount: faceDownCountOf(game.state, pile),
      label: labelFor(pile),
      selectedCardId: selection.selectedCardId,
      rejected: rejected === pileKey(pile),
      fanCount: pile.kind === "waste" ? game.drawMode : 1,
      tabIndex: pileKey(focusedPile) === pileKey(pile) ? 0 : -1,
      onCardPointerDown: (_c: Card, index: number, e: React.PointerEvent<HTMLDivElement>) => {
        const source = sourceAt(pile, index);
        if (source) selection.onCardPointerDown(source, e);
      },
      onCardClick: (_c: Card, index: number) => {
        if (pile.kind === "stock") return tapOrDropOnStock();
        const source = sourceAt(pile, index);
        if (source) selection.onCardTap(source);
        else selection.onPileTap(pile);
      },
      onCardDoubleClick: (_c: Card, index: number) => {
        const source = sourceAt(pile, index);
        if (source) autoMoveFrom(source.from, source.count);
      },
      onPileClick: () =>
        pile.kind === "stock" ? tapOrDropOnStock() : selection.onPileTap(pile),
    };
  };

  return (
    <main
      className="flex min-h-screen flex-col"
      onKeyDown={onBoardKeyDown}
      ref={boardRef}
      style={{ padding: 0 }}
    >
      <header
        className="flex items-center justify-between text-[13px] text-muted"
        style={{ padding: "var(--pad-board)" }}
      >
        <span className="font-num" title={strings.seed.hint}>
          {strings.seed.label(game.seed)}
        </span>
        <span className="sr-only">{strings.a11y.keyboardHint}</span>
      </header>

      <div
        aria-label={strings.a11y.board}
        className="flex flex-col gap-4"
        role="group"
        style={{ paddingInline: "var(--pad-board)" }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(7, var(--card-w))",
            gap: "var(--gap-x)",
            justifyContent: "center",
          }}
        >
          <PileView {...pileProps(STOCK)} />
          <PileView {...pileProps(WASTE)} />
          <div aria-hidden="true" />
          {FOUNDATIONS.map((pile) => (
            <PileView key={pileKey(pile)} {...pileProps(pile)} />
          ))}
        </div>

        <div
          className="grid items-start"
          style={{
            gridTemplateColumns: "repeat(7, var(--card-w))",
            gap: "var(--gap-x)",
            justifyContent: "center",
          }}
        >
          {TABLEAU.map((pile) => (
            <PileView key={pileKey(pile)} {...pileProps(pile)} />
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <Toolbar
          canAutoComplete={game.autoCompleteAvailable}
          canUndo={game.canUndo}
          drawMode={game.drawMode}
          onAutoComplete={() => setAutoRunning(true)}
          onDrawModeChange={(mode) => {
            // Changing draw mode redeals, so it needs consent when a game is under way.
            if (game.moveCount === 0) game.setDrawMode(mode);
            else setPendingDrawMode(mode);
          }}
          onNewGame={() => {
            stopAuto();
            selection.clear();
            game.newGame();
          }}
          onRestart={() => {
            stopAuto();
            selection.clear();
            game.restart();
          }}
          onUndo={() => {
            stopAuto();
            selection.clear();
            game.undo();
          }}
        />
      </div>

      {/* The dragged card follows the pointer outside the pile it came from, so it
          lives here rather than inside PileView. pointer-events: none keeps it from
          hit-testing itself when the drop target is looked up. */}
      {selection.selection.kind === "dragging" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50"
          style={{
            left: selection.selection.x - selection.selection.dx,
            top: selection.selection.y - selection.selection.dy,
          }}
        >
          <DraggedCard cardId={selection.selection.cardId} state={game.state} />
        </div>
      )}

      {pendingDrawMode !== null && (
        <div
          aria-labelledby="draw-mode-title"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
        >
          <div className="max-w-sm rounded bg-toolbar p-4 text-fg">
            <h2 className="text-[16px] font-semibold" id="draw-mode-title">
              {strings.confirm.drawModeTitle}
            </h2>
            <p className="mt-2 text-[14px] text-muted">{strings.confirm.drawModeBody}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="focus-ring min-h-[44px] rounded px-3 text-[14px]"
                onClick={() => setPendingDrawMode(null)}
                type="button"
              >
                {strings.confirm.cancel}
              </button>
              <button
                className="focus-ring min-h-[44px] rounded bg-card px-3 text-[14px] text-card-black"
                onClick={() => {
                  game.setDrawMode(pendingDrawMode);
                  setPendingDrawMode(null);
                }}
                type="button"
              >
                {strings.confirm.accept}
              </button>
            </div>
          </div>
        </div>
      )}

      {game.won && (
        <WinOverlay
          cards={wonCards}
          moveCount={game.moveCount}
          onPlayAgain={() => {
            selection.clear();
            game.newGame();
          }}
        />
      )}
    </main>
  );
}

/** The card under the cursor while dragging. Face up by definition - a face-down card
 *  is never a legal source, so sourceAt refuses to build one. */
function DraggedCard({ cardId, state }: { cardId: string; state: GameState }) {
  const card = ALL_PILES.flatMap((p) => cardsOf(state, p)).find((c) => c.id === cardId);
  if (!card) return null;
  return <CardView card={card} faceUp />;
}
