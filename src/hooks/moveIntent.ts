import type { PileId } from "@/game/state";

/**
 * What the player asked for, before anyone has judged whether it is legal.
 *
 * Tapping and dragging are both first-class inputs, and this is the only thing either
 * of them is allowed to produce. Without it each input path would end up with its own
 * copy of the rules, and they would drift - invariant #6.
 */
export type MoveIntent = { from: PileId; count: number; to: PileId };
