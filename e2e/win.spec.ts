import { expect, test, type Locator, type Page } from "@playwright/test";
import fixture from "./fixtures/winnable.json";

/**
 * FR-08: one deal played all the way to the win screen, through the real UI.
 *
 * Roughly a fifth of Klondike deals cannot be won at all and the winnable ones are not
 * winnable by playing greedily, so this line was found by search - see
 * scripts/find-winnable.ts. The fixture stops at the first position where every card is
 * face up, and the game's own "Hoàn tất" plays the rest: that is the button's whole
 * purpose, and it keeps the replay to something a browser test can afford.
 *
 * It runs on one viewport. The point here is the rules and the win path, and those do
 * not vary by screen width; the layout suite is what covers the widths.
 */

type Move = (typeof fixture.moves)[number];

const pileSelector = (pile: { kind: string; index?: number }) =>
  `[data-pile="${pile.index === undefined ? pile.kind : `${pile.kind}-${pile.index}`}"]`;

async function clickSourceCard(page: Page, move: Extract<Move, { type: "move" }>) {
  const pile = page.locator(pileSelector(move.from));
  const cards = pile.locator("[data-card]");
  const total = await cards.count();
  // The run being lifted is the last `count` cards of the pile, so its lowest card is
  // the one to grab - everything above it comes along.
  //
  // Click near its top edge, not its centre: cards in a column overlap, so a covered
  // card's centre is under the card above it. The visible strip is where a player aims
  // too, which is why this is the right place for the test to aim as well.
  await cards.nth(total - move.count).click({ position: { x: 12, y: 8 } });
}

async function playMove(page: Page, stock: Locator, move: Move) {
  if (move.type === "draw" || move.type === "recycle") {
    await stock.click();
    return;
  }
  await clickSourceCard(page, move);
  await page.locator(pileSelector(move.to)).click();
}

test.describe("a game played to the end - FR-08", () => {
  test.setTimeout(240_000);

  test("replaying a known solution reaches the win screen", async ({ page }, testInfo) => {
    // One viewport is enough: this is about the rules and the win path, and neither
    // varies by screen width. layout.spec.ts is what covers the widths.
    test.skip(testInfo.project.name !== "desktop-1440", "runs once, on the widest board");

    await page.goto(`/?van=${fixture.seed}`);
    await expect(page.locator("[data-card]").first()).toBeVisible();

    const stock = page.locator('[data-pile="stock"]');
    const autoComplete = page.getByRole("button", { name: "Hoàn tất" });

    // Nothing is finishable at the deal: every column still hides cards.
    await expect(autoComplete).toHaveAttribute("aria-disabled", "true");

    for (const move of fixture.moves as Move[]) {
      await playMove(page, stock, move);
    }

    // Every card is face up now, which is exactly when the button turns on.
    await expect(autoComplete).not.toHaveAttribute("aria-disabled", "true");
    await autoComplete.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await expect(dialog).toContainText("Thắng rồi!");

    await dialog.getByRole("button", { name: "Chơi ván mới" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
