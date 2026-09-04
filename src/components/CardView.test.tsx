import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { cardId, type Card } from "@/game/cards";
import { strings } from "@/lib/strings";
import { CardView } from "./CardView";

const queenOfHearts: Card = { id: cardId("hearts", 12), suit: "hearts", rank: 12 };
const sevenOfSpades: Card = { id: cardId("spades", 7), suit: "spades", rank: 7 };

describe("CardView", () => {
  it("labels a face-up card with its Vietnamese name", () => {
    render(<CardView card={queenOfHearts} faceUp />);
    expect(screen.getByLabelText("Cơ Đầm")).toBeTruthy();
  });

  it("says how many cards move with it", () => {
    render(<CardView card={sevenOfSpades} faceUp stackCount={3} />);
    expect(screen.getByLabelText(strings.card.label("spades", 7, 3))).toBeTruthy();
  });

  it("hides the identity of a face-down card", () => {
    render(<CardView card={queenOfHearts} faceUp={false} />);
    expect(screen.getByLabelText(strings.card.faceDown)).toBeTruthy();
    expect(screen.queryByLabelText("Cơ Đầm")).toBeNull();
  });

  it("announces the selected state in the label", () => {
    render(<CardView card={queenOfHearts} faceUp selected />);
    const el = screen.getByLabelText(`Cơ Đầm, ${strings.card.selected}`);
    expect(el.getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps a 44px hit area even though the drawn card is narrower - NFR-A11Y-03", () => {
    const { container } = render(<CardView card={queenOfHearts} faceUp />);
    const hit = container.querySelector<HTMLElement>("[data-hit-area]");
    expect(hit).not.toBeNull();
    expect(hit?.style.minWidth).toBe("44px");
    expect(hit?.style.minHeight).toBe("44px");
    // The drawn card itself is untouched: still one --card-w wide.
    const card = screen.getByLabelText("Cơ Đầm");
    expect(card.style.width).toBe("var(--card-w)");
  });

  it("emits the pointer and click callbacks it is given", () => {
    const onPointerDown = vi.fn();
    const onClick = vi.fn();
    const onDoubleClick = vi.fn();
    render(
      <CardView
        card={queenOfHearts}
        faceUp
        onPointerDown={onPointerDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />,
    );
    const el = screen.getByLabelText("Cơ Đầm");
    fireEvent.pointerDown(el);
    fireEvent.click(el);
    fireEvent.doubleClick(el);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDoubleClick).toHaveBeenCalledTimes(1);
  });

  it("carries its stable card id, which is what animations key off", () => {
    render(<CardView card={sevenOfSpades} faceUp />);
    expect(screen.getByLabelText("Bích Bảy").getAttribute("data-card")).toBe("spades-7");
  });
});
