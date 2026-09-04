"use client";

import type { PointerEvent, KeyboardEvent, MouseEvent } from "react";
import { colorOf, type Card } from "@/game/cards";
import { RANK_LABELS, SUIT_GLYPHS, strings } from "@/lib/strings";

/**
 * One playing card. Purely presentational: it takes props and emits callbacks, and
 * never asks whether a move is legal - that is moves.ts's job, and a component
 * answering it would be a second copy of the rules (invariant #6).
 *
 * Cards are absolutely positioned inside their PileView, which owns the offsets. That
 * keeps overlap maths in one place and lets a card animate between two positions
 * without the pile relaying out around it.
 */

/** A CSS length: a number is px, a string is used verbatim (so PileView can pass a
 *  calc() built from the responsive --overlap-* tokens instead of a fixed pixel). */
export type CssLength = number | string;

export type CardViewProps = {
  card: Card;
  faceUp: boolean;
  selected?: boolean;
  /** How many cards move with this one; only affects the aria-label. */
  stackCount?: number;
  offsetTop?: CssLength;
  offsetLeft?: CssLength;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
};

export function toCssLength(value: CssLength | undefined): string {
  if (value === undefined) return "0";
  return typeof value === "number" ? `${value}px` : value;
}

/** NFR-A11Y-03. At 320px a drawn card is ~41px wide, so the hit area cannot be the
 *  card: it is a transparent overlay that spills over the neighbours instead. */
const MIN_TOUCH_PX = 44;

export function CardView({
  card,
  faceUp,
  selected = false,
  stackCount = 1,
  offsetTop,
  offsetLeft,
  onPointerDown,
  onClick,
  onDoubleClick,
  onKeyDown,
  tabIndex = -1,
}: CardViewProps) {
  const base = faceUp
    ? strings.card.label(card.suit, card.rank, stackCount)
    : strings.card.faceDown;
  const label = selected ? `${base}, ${strings.card.selected}` : base;

  return (
    <div
      role="button"
      aria-label={label}
      aria-pressed={selected}
      data-card={card.id}
      data-face={faceUp ? "up" : "down"}
      data-selected={selected ? "true" : undefined}
      tabIndex={tabIndex}
      className="focus-ring absolute select-none"
      style={{
        top: toCssLength(offsetTop),
        left: toCssLength(offsetLeft),
        width: "var(--card-w)",
        height: "var(--card-h)",
        borderRadius: "var(--radius-card)",
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: "var(--edge-card)",
        // The browser must not claim the gesture, or a drag turns into a scroll.
        touchAction: "none",
        transition: "top var(--dur-move) var(--ease-move), left var(--dur-move) var(--ease-move)",
        boxShadow: selected ? "0 0 0 3px var(--ring-focus)" : undefined,
      }}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
    >
      {faceUp ? <CardFace card={card} /> : <CardBack />}
      <span
        aria-hidden="true"
        data-hit-area="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
          minWidth: `${MIN_TOUCH_PX}px`,
          minHeight: `${MIN_TOUCH_PX}px`,
        }}
      />
    </div>
  );
}

function CardFace({ card }: { card: Card }) {
  const tone = colorOf(card.suit) === "red" ? "text-card-red" : "text-card-black";
  const rank = RANK_LABELS[card.rank];
  const glyph = SUIT_GLYPHS[card.suit];

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-card ${tone}`}
      style={{ borderRadius: "calc(var(--radius-card) - 1px)" }}
    >
      <Corner rank={rank} glyph={glyph} className="left-[2px] top-[1px]" />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] leading-none md:text-[28px] xl:text-[38px]"
      >
        {glyph}
      </span>
      <Corner rank={rank} glyph={glyph} className="bottom-[1px] right-[2px] rotate-180" />
    </div>
  );
}

function Corner({
  rank,
  glyph,
  className,
}: {
  rank: string;
  glyph: string;
  className: string;
}) {
  return (
    <span aria-hidden="true" className={`absolute flex flex-col items-center ${className}`}>
      <span className="font-num text-[14px] font-bold leading-none md:text-[20px] xl:text-[26px]">
        {rank}
      </span>
      <span className="text-[12px] leading-none md:text-[16px] xl:text-[20px]">{glyph}</span>
    </span>
  );
}

/** No image: a CSS pattern keeps the bundle empty of assets and stays sharp at any
 *  pixel density (design.md section 4). */
function CardBack() {
  return (
    <div
      aria-hidden="true"
      className="h-full w-full bg-card-back"
      style={{
        borderRadius: "calc(var(--radius-card) - 1px)",
        backgroundImage:
          "repeating-linear-gradient(45deg, var(--fg-card-back) 0 2px, transparent 2px 6px)",
      }}
    />
  );
}
