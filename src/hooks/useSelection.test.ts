import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSelection, type DragSource } from "./useSelection";
import { pileKey, type PileId } from "@/game/state";
import type { MoveIntent } from "./moveIntent";

const T0: PileId = { kind: "tableau", index: 0 };
const T1: PileId = { kind: "tableau", index: 1 };
const F0: PileId = { kind: "foundation", index: 0 };

const PILES: PileId[] = [T0, T1, F0, { kind: "stock" }, { kind: "waste" }];
const byKey = (key: string) => PILES.find((p) => pileKey(p) === key) ?? null;

const sourceOn = (from: PileId, cardId: string, count = 1): DragSource => ({
  from,
  count,
  cardId,
});

function setup() {
  const onIntent = vi.fn<(i: MoveIntent) => void>();
  const hook = renderHook(() => useSelection(onIntent, byKey));
  return { onIntent, ...hook };
}

describe("useSelection - the tap branch", () => {
  it("starts idle", () => {
    const { result } = setup();
    expect(result.current.selection.kind).toBe("idle");
  });

  it("tapping a card selects it", () => {
    const { result } = setup();
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13")));
    expect(result.current.selection.kind).toBe("selected");
    expect(result.current.selectedCardId).toBe("spades-13");
  });

  it("tapping the same card again deselects it", () => {
    const { result } = setup();
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13")));
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13")));
    expect(result.current.selection.kind).toBe("idle");
  });

  it("tapping another card in the same pile moves the selection instead of playing", () => {
    const { onIntent, result } = setup();
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13")));
    act(() => result.current.onCardTap(sourceOn(T0, "hearts-12")));
    expect(onIntent).not.toHaveBeenCalled();
    expect(result.current.selectedCardId).toBe("hearts-12");
  });

  it("tapping a pile after selecting emits one intent and clears the selection", () => {
    const { onIntent, result } = setup();
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13", 2)));
    act(() => result.current.onPileTap(T1));
    expect(onIntent).toHaveBeenCalledWith({ from: T0, count: 2, to: T1 });
    expect(result.current.selection.kind).toBe("idle");
  });

  it("dropping a pile onto itself is not a move", () => {
    const { onIntent, result } = setup();
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13")));
    act(() => result.current.onPileTap(T0));
    expect(onIntent).not.toHaveBeenCalled();
    expect(result.current.selection.kind).toBe("idle");
  });

  it("tapping a pile while idle does nothing", () => {
    const { onIntent, result } = setup();
    act(() => result.current.onPileTap(T1));
    expect(onIntent).not.toHaveBeenCalled();
  });

  it("Escape clears the selection - NFR-REL-03", () => {
    const { result } = setup();
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13")));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.selection.kind).toBe("idle");
  });
});

describe("useSelection - the keyboard branch reuses the tap transitions", () => {
  it("selectSource then dropOn emits the same intent tapping would", () => {
    const { onIntent, result } = setup();
    act(() => result.current.selectSource(sourceOn(T0, "spades-13", 3)));
    act(() => result.current.dropOn(F0));
    expect(onIntent).toHaveBeenCalledWith({ from: T0, count: 3, to: F0 });
  });
});

describe("useSelection - the drag branch", () => {
  /** happy-dom has no layout, so every element reports a zero-sized rect. */
  const pointerDownOn = (result: { current: ReturnType<typeof useSelection> }, s: DragSource) =>
    act(() =>
      result.current.onCardPointerDown(s, {
        button: 0,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        currentTarget: { getBoundingClientRect: () => ({ left: 90, top: 90 }) },
      } as unknown as React.PointerEvent),
    );

  const pointer = (type: string, x: number, y: number) =>
    Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
      pointerId: 1,
      clientX: x,
      clientY: y,
    });

  it("a press that never travels far enough stays a tap, not a drag", () => {
    const { result } = setup();
    pointerDownOn(result, sourceOn(T0, "spades-13"));
    act(() => {
      window.dispatchEvent(pointer("pointermove", 103, 102));
    });
    expect(result.current.selection.kind).toBe("idle");
  });

  it("travelling past the threshold starts a drag", () => {
    const { result } = setup();
    pointerDownOn(result, sourceOn(T0, "spades-13"));
    act(() => {
      window.dispatchEvent(pointer("pointermove", 140, 160));
    });
    expect(result.current.selection.kind).toBe("dragging");
  });

  it("dropping outside any pile puts the card back with no move", () => {
    const { onIntent, result } = setup();
    pointerDownOn(result, sourceOn(T0, "spades-13"));
    act(() => {
      window.dispatchEvent(pointer("pointermove", 140, 160));
      window.dispatchEvent(pointer("pointerup", 140, 160));
    });
    expect(onIntent).not.toHaveBeenCalled();
    expect(result.current.selection.kind).toBe("idle");
  });

  it("pointercancel ends the drag - NFR-REL-03", () => {
    const { onIntent, result } = setup();
    pointerDownOn(result, sourceOn(T0, "spades-13"));
    act(() => {
      window.dispatchEvent(pointer("pointermove", 140, 160));
      window.dispatchEvent(new Event("pointercancel"));
    });
    expect(result.current.selection.kind).toBe("idle");
    expect(onIntent).not.toHaveBeenCalled();
  });

  it("dropping on a pile emits the intent", () => {
    const { onIntent, result } = setup();
    const el = document.createElement("div");
    el.dataset.pile = pileKey(T1);
    document.body.appendChild(el);
    vi.spyOn(document, "elementFromPoint").mockReturnValue(el);

    pointerDownOn(result, sourceOn(T0, "spades-13", 2));
    act(() => {
      window.dispatchEvent(pointer("pointermove", 140, 160));
      window.dispatchEvent(pointer("pointerup", 140, 160));
    });
    expect(onIntent).toHaveBeenCalledWith({ from: T0, count: 2, to: T1 });

    vi.restoreAllMocks();
    el.remove();
  });

  it("the click that follows a drag does not also count as a tap", () => {
    const { onIntent, result } = setup();
    pointerDownOn(result, sourceOn(T0, "spades-13"));
    act(() => {
      window.dispatchEvent(pointer("pointermove", 140, 160));
      window.dispatchEvent(pointer("pointerup", 140, 160));
    });
    act(() => result.current.onCardTap(sourceOn(T0, "spades-13")));
    expect(result.current.selection.kind).toBe("idle");
    expect(onIntent).not.toHaveBeenCalled();
  });
});
