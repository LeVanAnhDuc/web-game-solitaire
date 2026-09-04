import { createDeck, type Card } from "./cards";
import { mulberry32, shuffle } from "./rng";
import {
  TABLEAU_COUNT,
  type DrawMode,
  type GameState,
  type TableauColumn,
} from "./state";

/**
 * The opening board is a pure function of the seed - no clock, no Math.random, so the
 * same game number always deals the same cards (ADR-0001, invariant #3).
 */
export function deal(seed: number, drawMode: DrawMode): GameState {
  const deck = shuffle(createDeck(), mulberry32(seed));

  const down: Card[][] = Array.from({ length: TABLEAU_COUNT }, () => []);
  const up: Card[][] = Array.from({ length: TABLEAU_COUNT }, () => []);

  // Dealt row by row the way a person deals it: on row r, one card to every column
  // from r rightwards. A column's last card lands on the row matching its index, and
  // that is the one turned face up - which is why column i ends with i face-down cards.
  let next = 0;
  for (let row = 0; row < TABLEAU_COUNT; row++) {
    for (let col = row; col < TABLEAU_COUNT; col++) {
      const card = deck[next++];
      (row === col ? up : down)[col].push(card);
    }
  }

  const tableau: TableauColumn[] = down.map((d, i) => ({ down: d, up: up[i] }));

  return {
    seed,
    drawMode,
    stock: deck.slice(next), // 52 - 28 = 24, last element on top
    waste: [],
    foundations: [[], [], [], []],
    tableau,
  };
}
