import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The suite addresses the board through its Vietnamese accessible labels rather than
 * test ids (design.md section 5). One selector then checks two things at once: that
 * the move works, and that the label a screen reader needs is actually there.
 */

/** A deal the whole suite shares, so a failure is always reproducible - FR-13. */
export const FIXED_SEED = 20260904;

export async function openGame(page: Page, seed: number = FIXED_SEED) {
  await page.goto(`/?van=${seed}`);
  // The deal happens on mount, so wait for a card rather than for load state.
  await expect(page.locator("[data-card]").first()).toBeVisible();
}

export const board = (page: Page) => page.getByRole("group", { name: "Bàn bài Klondike" });

export const pile = (page: Page, label: string): Locator => page.getByLabel(label, { exact: true });

export const tableau = (page: Page, index: number) => pile(page, `Cột bài ${index + 1}`);
export const stock = (page: Page) => pile(page, "Chồng rút");
export const waste = (page: Page) => pile(page, "Bài đã rút");

/** Cards inside a pile, bottom first - the same order the state uses. */
export const cardsIn = (p: Locator) => p.locator("[data-card]");

export const topCardOf = (p: Locator) => cardsIn(p).last();

export async function cardCount(p: Locator): Promise<number> {
  return cardsIn(p).count();
}

/** Moves by tapping: pick up the top card of one pile, put it on another. */
export async function tapMove(from: Locator, to: Locator) {
  await topCardOf(from).click();
  await to.click();
}

/** Moves by dragging, which must produce exactly the same result as tapping. */
export async function dragMove(page: Page, from: Locator, to: Locator) {
  const source = topCardOf(from);
  const start = await source.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error("cannot drag: one of the piles has no box");
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  // Two steps: the first crosses the 6px threshold that separates a tap from a drag.
  await page.mouse.move(start.x + start.width / 2 + 20, start.y + start.height / 2 + 20);
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 8 });
  await page.mouse.up();
}

export const button = (page: Page, name: string) => page.getByRole("button", { name });
