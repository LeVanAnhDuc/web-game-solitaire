"use client";

import type { ReactNode } from "react";
import { FastForward, Plus, RotateCcw, Undo2 } from "lucide-react";
import type { DrawMode } from "@/game/state";
import { strings } from "@/lib/strings";

/**
 * The control strip. Every action is a callback; the toolbar decides nothing about
 * the game itself, only whether a control is currently offerable.
 */

export type ToolbarProps = {
  onUndo: () => void;
  onRestart: () => void;
  onNewGame: () => void;
  onAutoComplete: () => void;
  drawMode: DrawMode;
  onDrawModeChange: (mode: DrawMode) => void;
  canUndo: boolean;
  canAutoComplete: boolean;
};

/** NFR-A11Y-03 again: the button, not just its icon, is the 44px target. */
const CONTROL = "inline-flex min-h-[44px] items-center gap-2 rounded px-3 text-[14px] font-medium";

export function Toolbar({
  onUndo,
  onRestart,
  onNewGame,
  onAutoComplete,
  drawMode,
  onDrawModeChange,
  canUndo,
  canAutoComplete,
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={strings.a11y.toolbar}
      className="flex flex-wrap items-center gap-2 bg-toolbar px-2 py-2 text-fg"
      style={{ paddingInline: "var(--pad-board)" }}
    >
      <ToolbarButton label={strings.toolbar.undo} disabled={!canUndo} onClick={onUndo}>
        <Undo2 aria-hidden="true" size={18} />
      </ToolbarButton>

      <ToolbarButton label={strings.toolbar.restart} onClick={onRestart}>
        <RotateCcw aria-hidden="true" size={18} />
      </ToolbarButton>

      <ToolbarButton label={strings.toolbar.newGame} onClick={onNewGame}>
        <Plus aria-hidden="true" size={18} />
      </ToolbarButton>

      <ToolbarButton
        label={strings.toolbar.autoComplete}
        disabled={!canAutoComplete}
        onClick={onAutoComplete}
      >
        <FastForward aria-hidden="true" size={18} />
      </ToolbarButton>

      <select
        aria-label={strings.toolbar.drawMode}
        className={`${CONTROL} border border-muted bg-toolbar text-fg`}
        value={String(drawMode)}
        onChange={(event) => onDrawModeChange(event.target.value === "3" ? 3 : 1)}
      >
        <option value="1">{strings.toolbar.draw1}</option>
        <option value="3">{strings.toolbar.draw3}</option>
      </select>
    </div>
  );
}

/**
 * Disabled controls stay focusable and stay announced: `aria-disabled` rather than the
 * `disabled` attribute, which removes the button from the tab order and from most
 * screen-reader walk-throughs, so the player is never told why the action is gone.
 */
function ToolbarButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      data-disabled={disabled ? "true" : undefined}
      className={`focus-ring ${CONTROL} bg-toolbar text-fg ${disabled ? "opacity-50" : ""}`}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
