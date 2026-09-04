"use client";

import { useEffect, useRef, useState } from "react";
import { colorOf, type Card } from "@/game/cards";
import { RANK_LABELS, SUIT_GLYPHS, strings } from "@/lib/strings";

/**
 * The win celebration - FR-08, ADR-0003. A decorative canvas cascade behind a real
 * DOM dialog: the dialog is what a screen reader and the e2e suite see, the canvas is
 * aria-hidden and entirely optional.
 *
 * NFR-A11Y-05: under prefers-reduced-motion there is no canvas at all - not a paused
 * one, not a static frame. The element is never mounted.
 */

export type WinOverlayProps = {
  cards: readonly Card[];
  moveCount: number;
  onPlayAgain: () => void;
};

const MEDIA_REDUCE = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(MEDIA_REDUCE).matches;
}

export function WinOverlay({ cards, moveCount, onPlayAgain }: WinOverlayProps) {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(MEDIA_REDUCE);
    const onChange = () => setReduced(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {!reduced && <Cascade cards={cards} />}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={strings.win.title}
        tabIndex={-1}
        className="focus-ring relative z-10 flex flex-col items-center gap-4 rounded bg-toolbar text-fg"
        style={{ padding: "var(--pad-board)" }}
      >
        <h2 className="text-[24px] font-bold leading-tight md:text-[32px] xl:text-[40px]">
          {strings.win.title}
        </h2>
        <p className="text-[14px] text-muted">{strings.win.body(moveCount)}</p>
        <button
          type="button"
          className="focus-ring inline-flex min-h-[44px] items-center rounded border border-muted px-4 text-[14px] font-medium"
          onClick={onPlayAgain}
        >
          {strings.win.playAgain}
        </button>
      </div>
    </div>
  );
}

type Faller = {
  card: Card;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

/** Deterministic per-card jitter. Nothing here is a rule, but a reproducible cascade
 *  is easier to eyeball than a random one. */
function jitter(index: number): number {
  const n = Math.sin(index * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

function Cascade({ cards }: { cards: readonly Card[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let frame = 0;
    // Registered before anything can bail out, so unmount always cancels whatever was
    // scheduled - including nothing.
    const cancel = () => cancelAnimationFrame(frame);

    const canvas = canvasRef.current;
    if (!canvas) return cancel;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return cancel;
    const g = ctx;

    // MASTER.md stays the single source: the palette is read back out of the CSS
    // variables rather than restated here.
    const style = getComputedStyle(document.documentElement);
    const faceColor = style.getPropertyValue("--bg-card").trim();
    const edgeColor = style.getPropertyValue("--edge-card").trim();
    const redColor = style.getPropertyValue("--fg-card-red").trim();
    const blackColor = style.getPropertyValue("--fg-card-black").trim();
    const fontNum = style.getPropertyValue("--font-num").trim();

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    g.scale(dpr, dpr);

    const cw = Math.max(40, Math.min(96, width / 9));
    const ch = cw * 1.4;
    const radius = cw * 0.1;

    // Cards leave from where the foundations sit: four slots at the top right.
    const slotGap = cw + 8;
    const firstSlot = width - 4 * slotGap;

    const queue = [...cards];
    const live: Faller[] = [];
    let sinceLast = Infinity;
    let last = 0;

    function launch(index: number) {
      const card = queue.shift();
      if (!card) return;
      const slot = index % 4;
      live.push({
        card,
        x: firstSlot + slot * slotGap,
        y: 24,
        vx: (jitter(index) - 0.5) * 8,
        vy: 0,
      });
    }

    function drawCard(f: Faller) {
      g.save();
      g.beginPath();
      if (typeof g.roundRect === "function") g.roundRect(f.x, f.y, cw, ch, radius);
      else g.rect(f.x, f.y, cw, ch);
      g.fillStyle = faceColor;
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = edgeColor;
      g.stroke();
      g.fillStyle = colorOf(f.card.suit) === "red" ? redColor : blackColor;
      g.font = `700 ${Math.round(cw * 0.34)}px ${fontNum}`;
      g.textBaseline = "top";
      g.fillText(RANK_LABELS[f.card.rank], f.x + 4, f.y + 4);
      g.font = `${Math.round(cw * 0.42)}px ${fontNum}`;
      g.textBaseline = "middle";
      g.textAlign = "center";
      g.fillText(SUIT_GLYPHS[f.card.suit], f.x + cw / 2, f.y + ch / 2);
      g.restore();
    }

    let launched = 0;

    function step(now: number) {
      const dt = last === 0 ? 16 : Math.min(48, now - last);
      last = now;
      sinceLast += dt;

      if (queue.length > 0 && sinceLast > 140) {
        launch(launched);
        launched += 1;
        sinceLast = 0;
      }

      g.clearRect(0, 0, width, height);

      for (let i = live.length - 1; i >= 0; i -= 1) {
        const f = live[i];
        f.vy += 0.6 * (dt / 16);
        f.x += f.vx * (dt / 16);
        f.y += f.vy * (dt / 16);
        if (f.y + ch >= height) {
          f.y = height - ch;
          f.vy = -f.vy * 0.72;
          // A card that has stopped bouncing would sit at the bottom forever.
          if (Math.abs(f.vy) < 2) f.vy = -6;
        }
        if (f.x + cw < 0 || f.x > width) live.splice(i, 1);
        else drawCard(f);
      }

      if (queue.length > 0 || live.length > 0) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return cancel;
  }, [cards]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
