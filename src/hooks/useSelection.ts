"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardId } from "@/game/cards";
import { pileIdEquals, pileKey, type PileId } from "@/game/state";
import type { MoveIntent } from "./moveIntent";

/**
 * The one state machine behind every way of moving a card: tap, drag, and keyboard.
 *
 * All three end in the same place - an intent handed to useGame - because the moment
 * an input path is allowed to decide a move for itself, there are two copies of the
 * rules and they drift (invariant #6). Keyboard reuses `selected` rather than getting
 * a branch of its own, for the same reason.
 */

/** Below this many pixels of travel, a press is a tap, not a drag. */
const DRAG_THRESHOLD_PX = 6;

export type DragSource = { from: PileId; count: number; cardId: CardId };

export type SelectionState =
  | { kind: "idle" }
  | ({ kind: "selected" } & DragSource)
  | ({ kind: "dragging" } & DragSource & { x: number; y: number; dx: number; dy: number });

export type UseSelection = {
  selection: SelectionState;
  /** Convenience for components: the card currently picked up, if any. */
  selectedCardId: CardId | undefined;
  onCardPointerDown: (source: DragSource, e: React.PointerEvent) => void;
  /** A tap or click that was not a drag. */
  onCardTap: (source: DragSource) => void;
  onPileTap: (to: PileId) => void;
  /** Keyboard uses these directly; they are the same transitions tapping uses. */
  selectSource: (source: DragSource) => void;
  dropOn: (to: PileId) => void;
  clear: () => void;
};

/**
 * Finds the pile under a screen point. The drag preview sets pointer-events: none, so
 * it never hit-tests itself; anything else under the cursor is either a pile or the
 * table.
 */
function pileKeyAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>("[data-pile]")?.dataset.pile ?? null;
}

export function useSelection(
  onIntent: (intent: MoveIntent) => void,
  pileByKey: (key: string) => PileId | null,
): UseSelection {
  const [selection, setSelection] = useState<SelectionState>({ kind: "idle" });

  const press = useRef<{
    source: DragSource;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    pointerId: number;
    dragging: boolean;
  } | null>(null);
  /** A pointerup that ended a drag is still followed by a click; swallow that one. */
  const swallowNextTap = useRef(false);

  const clear = useCallback(() => setSelection({ kind: "idle" }), []);

  const selectSource = useCallback((source: DragSource) => {
    setSelection({ kind: "selected", ...source });
  }, []);

  const dropOn = useCallback(
    (to: PileId) => {
      setSelection((current) => {
        if (current.kind === "idle") return current;
        if (!pileIdEquals(current.from, to)) {
          onIntent({ from: current.from, count: current.count, to });
        }
        // Either way the gesture is over: a rejected move must not leave the player
        // holding a card with no way to put it down (NFR-REL-03).
        return { kind: "idle" };
      });
    },
    [onIntent],
  );

  const onCardTap = useCallback(
    (source: DragSource) => {
      if (swallowNextTap.current) {
        swallowNextTap.current = false;
        return;
      }
      setSelection((current) => {
        if (current.kind === "idle") return { kind: "selected", ...source };
        if (current.cardId === source.cardId) return { kind: "idle" };
        if (pileIdEquals(current.from, source.from)) return { kind: "selected", ...source };
        onIntent({ from: current.from, count: current.count, to: source.from });
        return { kind: "idle" };
      });
    },
    [onIntent],
  );

  const onPileTap = useCallback(
    (to: PileId) => {
      if (swallowNextTap.current) {
        swallowNextTap.current = false;
        return;
      }
      dropOn(to);
    },
    [dropOn],
  );

  const onCardPointerDown = useCallback((source: DragSource, e: React.PointerEvent) => {
    // Left button / primary touch only; a right-click must not start a drag.
    if (e.button !== 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    press.current = {
      source,
      startX: e.clientX,
      startY: e.clientY,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      pointerId: e.pointerId,
      dragging: false,
    };
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const p = press.current;
      if (!p || e.pointerId !== p.pointerId) return;
      if (!p.dragging) {
        const moved = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
        if (moved < DRAG_THRESHOLD_PX) return;
        p.dragging = true;
      }
      // Once dragging, stop the browser from scrolling or selecting text under the
      // finger - on touch that is what makes a drag feel broken.
      e.preventDefault();
      setSelection({
        kind: "dragging",
        ...p.source,
        x: e.clientX,
        y: e.clientY,
        dx: p.dx,
        dy: p.dy,
      });
    }

    function onUp(e: PointerEvent) {
      const p = press.current;
      if (!p || e.pointerId !== p.pointerId) return;
      press.current = null;
      if (!p.dragging) return; // a tap; onCardTap handles it
      swallowNextTap.current = true;
      const key = pileKeyAt(e.clientX, e.clientY);
      const target = key ? pileByKey(key) : null;
      if (target && !pileIdEquals(p.source.from, target)) {
        onIntent({ from: p.source.from, count: p.source.count, to: target });
      }
      setSelection({ kind: "idle" });
    }

    function onCancel() {
      // pointercancel, or the pointer leaving the window: put the card back rather
      // than leaving the gesture half-finished (NFR-REL-03).
      if (!press.current) return;
      press.current = null;
      swallowNextTap.current = true;
      setSelection({ kind: "idle" });
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onCancel);
    };
  }, [onIntent, pileByKey]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelection({ kind: "idle" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    selection,
    selectedCardId: selection.kind === "idle" ? undefined : selection.cardId,
    onCardPointerDown,
    onCardTap,
    onPileTap,
    selectSource,
    dropOn,
    clear,
  };
}

export { pileKey };
