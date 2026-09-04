import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { cardId, type Card, type Rank, type Suit } from "@/game/cards";
import type { PileId } from "@/game/state";
import { strings } from "@/lib/strings";
import { PileView } from "./PileView";

function card(suit: Suit, rank: Rank): Card {
  return { id: cardId(suit, rank), suit, rank };
}

const tableau0: PileId = { kind: "tableau", index: 0 };
const foundation1: PileId = { kind: "foundation", index: 1 };
const waste: PileId = { kind: "waste" };

describe("PileView", () => {
  it("draws the empty outline and keeps its label when it holds nothing", () => {
    const label = strings.pile.tableau(0);
    const { container } = render(<PileView pileId={tableau0} cards={[]} label={label} />);
    expect(screen.getByLabelText(label)).toBeTruthy();
    const outline = container.querySelector<HTMLElement>("[data-empty]");
    expect(outline).not.toBeNull();
    expect(outline?.style.borderColor).toBe("var(--edge-empty)");
    expect(screen.getByText(strings.pile.empty)).toBeTruthy();
  });

  it("exposes a stable data-pile for the drag layer to hit-test", () => {
    const { container } = render(
      <PileView pileId={foundation1} cards={[]} label={strings.pile.foundation("hearts")} />,
    );
    expect(container.querySelector("[data-pile]")?.getAttribute("data-pile")).toBe("foundation-1");
  });

  it("draws face-down cards first and the face-up run above them", () => {
    render(
      <PileView
        pileId={tableau0}
        cards={[card("spades", 5), card("hearts", 3), card("clubs", 13)]}
        faceDownCount={2}
        label={strings.pile.tableau(0)}
      />,
    );
    expect(screen.getAllByLabelText(strings.card.faceDown)).toHaveLength(2);
    expect(screen.getByLabelText(strings.card.label("clubs", 13, 1))).toBeTruthy();
  });

  it("keys every card by its id, so React never reuses the wrong node - invariant #8", () => {
    const a = card("spades", 5);
    const b = card("hearts", 3);
    const { container, rerender } = render(
      <PileView pileId={tableau0} cards={[a, b]} label={strings.pile.tableau(0)} />,
    );
    const before = container.querySelector(`[data-card="${b.id}"]`);
    rerender(<PileView pileId={tableau0} cards={[b, a]} label={strings.pile.tableau(0)} />);
    const after = container.querySelector(`[data-card="${b.id}"]`);
    // An index key would have moved this card's identity onto the other DOM node.
    expect(after).toBe(before);
  });

  it("selects the tapped card and everything stacked on top of it", () => {
    const a = card("spades", 5);
    const b = card("hearts", 4);
    const { container } = render(
      <PileView
        pileId={tableau0}
        cards={[a, b]}
        label={strings.pile.tableau(0)}
        selectedCardId={a.id}
      />,
    );
    expect(container.querySelectorAll("[data-selected='true']")).toHaveLength(2);
  });

  it("flashes when the parent reports a rejected move", () => {
    const { container, rerender } = render(
      <PileView pileId={tableau0} cards={[]} label={strings.pile.tableau(0)} />,
    );
    const pile = container.querySelector("[data-pile]");
    expect(pile?.className).not.toContain("reject-flash");
    rerender(<PileView pileId={tableau0} cards={[]} label={strings.pile.tableau(0)} rejected />);
    expect(container.querySelector("[data-pile]")?.className).toContain("reject-flash");
  });

  it("fans the waste when draw-3 asks for it, showing only the last three", () => {
    const cards = [card("spades", 2), card("hearts", 6), card("clubs", 9), card("diamonds", 11)];
    const { container } = render(
      <PileView pileId={waste} cards={cards} label={strings.pile.waste} fanCount={3} />,
    );
    const drawn = container.querySelectorAll<HTMLElement>("[data-card]");
    expect(drawn).toHaveLength(3);
    expect(drawn[0]?.style.left).toContain("0 * var(--overlap-up)");
    expect(drawn[2]?.style.left).toContain("2 * var(--overlap-up)");
  });

  it("reports a card tap and a bare-pile tap separately", () => {
    const onCardClick = vi.fn();
    const onPileClick = vi.fn();
    const top = card("clubs", 13);
    const { container } = render(
      <PileView
        pileId={tableau0}
        cards={[top]}
        label={strings.pile.tableau(0)}
        onCardClick={onCardClick}
        onPileClick={onPileClick}
      />,
    );
    fireEvent.click(screen.getByLabelText(strings.card.label("clubs", 13, 1)));
    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onPileClick).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector("[data-pile]") as Element);
    expect(onPileClick).toHaveBeenCalledTimes(1);
  });
});
