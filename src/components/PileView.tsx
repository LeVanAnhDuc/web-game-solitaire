"use client";

import type { PointerEvent, KeyboardEvent, MouseEvent } from "react";
import type { Card, CardId } from "@/game/cards";
import { pileKey, type PileId } from "@/game/state";
import { strings } from "@/lib/strings";
import { CardView } from "./CardView";

/**
 * One pile - stock, waste, a foundation or a tableau column. It owns the geometry
 * (which cards are visible, how far each is offset) and nothing else: it does not
 * know what a legal move is and never mutates state.
 *
 * `cards` is the whole pile bottom-first, matching cardsOf() in state.ts, and the
 * first `faceDownCount` of them are drawn face down. Passing counts instead of
 * separate arrays keeps every card's id available, which is what invariant #8 needs.
 */

export type PileViewProps = {
  pileId: PileId;
  /** Bottom card first - the last element is the top card, as everywhere else. */
  cards: readonly Card[];
  /** How many of the leading cards are face down. Tableau columns only. */
  faceDownCount?: number;
  label: string;
  selectedCardId?: CardId;
  /** Flashes the pile red for one beat after an illegal move (design.md section 2). */
  rejected?: boolean;
  /** How many waste cards to fan out - 3 in draw-3 mode. Ignored elsewhere. */
  fanCount?: number;
  onCardPointerDown?: (card: Card, index: number, event: PointerEvent<HTMLDivElement>) => void;
  onCardClick?: (card: Card, index: number, event: MouseEvent<HTMLDivElement>) => void;
  onCardDoubleClick?: (card: Card, index: number, event: MouseEvent<HTMLDivElement>) => void;
  onPileClick?: (pileId: PileId, event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
};

/** Cards stack downwards only in a tableau column; everywhere else the pile shows a
 *  single slot and, for the waste, a short horizontal fan. */
function offsetFor(pileId: PileId, index: number, faceDownCount: number, startIndex: number) {
  if (pileId.kind === "tableau") {
    const down = Math.min(index, faceDownCount);
    const up = Math.max(0, index - faceDownCount);
    return { top: `calc(${down} * var(--overlap-down) + ${up} * var(--overlap-up))`, left: "0px" };
  }
  if (pileId.kind === "waste") {
    return { top: "0px", left: `calc(${index - startIndex} * var(--overlap-up))` };
  }
  return { top: "0px", left: "0px" };
}

export function PileView({
  pileId,
  cards,
  faceDownCount = 0,
  label,
  selectedCardId,
  rejected = false,
  fanCount = 1,
  onCardPointerDown,
  onCardClick,
  onCardDoubleClick,
  onPileClick,
  onKeyDown,
  tabIndex,
}: PileViewProps) {
  const total = cards.length;
  const startIndex =
    pileId.kind === "tableau"
      ? 0
      : pileId.kind === "waste"
        ? Math.max(0, total - Math.max(1, fanCount))
        : Math.max(0, total - 1);

  const selectedIndex = selectedCardId ? cards.findIndex((c) => c.id === selectedCardId) : -1;

  // The container is absolutely-positioned children only, so its height has to be
  // stated or a long column would overlap the toolbar.
  const lastOffset = offsetFor(pileId, Math.max(0, total - 1), faceDownCount, startIndex);
  const height = total > 1 ? `calc(var(--card-h) + ${lastOffset.top})` : "var(--card-h)";

  return (
    <div
      role="group"
      aria-label={label}
      data-pile={pileKey(pileId)}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={(event) => onPileClick?.(pileId, event)}
      className={`focus-ring relative shrink-0 ${rejected ? "reject-flash" : ""}`}
      style={{
        width: "var(--card-w)",
        height,
        minHeight: "var(--card-h)",
        borderRadius: "var(--radius-card)",
      }}
    >
      {total === 0 && (
        <>
          <span className="sr-only">{strings.pile.empty}</span>
          <div
            aria-hidden="true"
            data-empty="true"
            className="absolute inset-0"
            style={{
              borderWidth: "2px",
              borderStyle: "solid",
              borderColor: "var(--edge-empty)",
              borderRadius: "var(--radius-card)",
            }}
          />
        </>
      )}

      {cards.map((card, index) => {
        if (index < startIndex) return null;
        const faceUp = index >= faceDownCount;
        const { top, left } = offsetFor(pileId, index, faceDownCount, startIndex);
        return (
          <CardView
            // invariant #8: the key is the card id, never the index. An index key makes
            // React reuse the wrong node and the move transition animates the wrong card.
            key={card.id}
            card={card}
            faceUp={faceUp}
            selected={selectedIndex >= 0 && index >= selectedIndex}
            stackCount={pileId.kind === "tableau" ? total - index : 1}
            offsetTop={top}
            offsetLeft={left}
            onPointerDown={(event) => onCardPointerDown?.(card, index, event)}
            onClick={(event) => {
              // Exactly one callback per click: without this the pile handler fires too
              // and the parent cannot tell "tapped a card" from "tapped the empty slot".
              event.stopPropagation();
              onCardClick?.(card, index, event);
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              onCardDoubleClick?.(card, index, event);
            }}
          />
        );
      })}
    </div>
  );
}
