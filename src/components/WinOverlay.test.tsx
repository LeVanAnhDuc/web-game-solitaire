import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createDeck } from "@/game/cards";
import { strings } from "@/lib/strings";
import { WinOverlay } from "./WinOverlay";

/** Pretend the OS setting is on or off. The component asks matchMedia and nothing else,
 *  so this is the whole seam for NFR-A11Y-05. */
function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduce,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  );
}

const deck = createDeck();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WinOverlay", () => {
  it("renders no canvas at all under prefers-reduced-motion - NFR-A11Y-05", () => {
    mockReducedMotion(true);
    const { container } = render(<WinOverlay cards={deck} moveCount={120} onPlayAgain={vi.fn()} />);
    expect(container.querySelector("canvas")).toBeNull();
    expect(screen.getByText(strings.win.title)).toBeTruthy();
    expect(screen.getByText(strings.win.body(120))).toBeTruthy();
    expect(screen.getByText(strings.win.playAgain)).toBeTruthy();
  });

  it("renders the cascade canvas when motion is allowed", () => {
    mockReducedMotion(false);
    const { container } = render(<WinOverlay cards={deck} moveCount={90} onPlayAgain={vi.fn()} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    // Decorative only: the dialog carries the meaning.
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
  });

  it("is a real dialog that takes focus", () => {
    mockReducedMotion(true);
    render(<WinOverlay cards={deck} moveCount={1} onPlayAgain={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe(strings.win.title);
    expect(document.activeElement).toBe(dialog);
  });

  it("calls onPlayAgain when the button is pressed", () => {
    mockReducedMotion(true);
    const onPlayAgain = vi.fn();
    render(<WinOverlay cards={deck} moveCount={42} onPlayAgain={onPlayAgain} />);
    fireEvent.click(screen.getByText(strings.win.playAgain));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("cancels its animation frame on unmount", () => {
    mockReducedMotion(false);
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<WinOverlay cards={deck} moveCount={5} onPlayAgain={vi.fn()} />);
    unmount();
    expect(cancel).toHaveBeenCalled();
    cancel.mockRestore();
  });
});
