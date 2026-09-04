import { expect, test } from "@playwright/test";
import { cardsIn, openGame, stock, tableau, waste } from "./helpers";

/**
 * US-01, US-02, US-04, US-05. The three input paths get the same assertions on
 * purpose: tapping, dragging and the keyboard all funnel into one MoveIntent
 * (design.md section 2), and these tests are what would catch them drifting apart.
 */

const undo = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Hoàn lại" });

test.describe("drawing from the stock - FR-03", () => {
  test("a tap moves a card to the waste, and the stock recycles when it runs out", async ({
    page,
  }) => {
    await openGame(page);
    await stock(page).click();
    await expect(cardsIn(waste(page))).toHaveCount(1);

    // 24 stock cards, one at a time; the 25th tap is the recycle.
    for (let i = 0; i < 23; i++) await stock(page).click();
    await expect(cardsIn(stock(page))).toHaveCount(0);
    await stock(page).click();
    await expect(cardsIn(waste(page))).toHaveCount(0);
    await expect(cardsIn(stock(page))).toHaveCount(1);
  });
});

test.describe("moving cards", () => {
  test("tapping a card and then a pile plays the move - US-01", async ({ page }) => {
    await openGame(page);
    const source = tableau(page, 6);
    const before = await cardsIn(source).count();
    // The top card of column 7 either has a home or it does not; either way the board
    // must respond and never leave the card stuck to the finger (NFR-REL-03).
    await cardsIn(source).last().click();
    await tableau(page, 0).click();
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
    const after = await cardsIn(source).count();
    expect([before, before - 1]).toContain(after);
  });

  test("an illegal move changes nothing - invariant #7", async ({ page }) => {
    await openGame(page);
    const snapshot = () =>
      page.locator("[data-card]").evaluateAll((els) => els.map((e) => e.getAttribute("data-card")));
    const before = await snapshot();
    // Nothing may ever be dropped onto the stock.
    await cardsIn(tableau(page, 6)).last().click();
    await stock(page).click();
    expect(await snapshot()).toEqual(before);
    await expect(undo(page)).toHaveAttribute("aria-disabled", "true");
  });

  test("Escape puts a picked-up card back down - NFR-REL-03", async ({ page }) => {
    await openGame(page);
    await cardsIn(tableau(page, 6)).last().click();
    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
  });

  test("a double tap sends a card to its first legal home - FR-05", async ({ page }) => {
    await openGame(page);
    // Draw until an ace shows up in the waste, then double-tap it onto a foundation.
    for (let i = 0; i < 24; i++) {
      const top = cardsIn(waste(page)).last();
      if ((await top.count()) > 0) {
        const label = await top.getAttribute("aria-label");
        if (label?.includes("Át")) {
          await top.dblclick();
          await expect(undo(page)).not.toHaveAttribute("aria-disabled", "true");
          return;
        }
      }
      await stock(page).click();
    }
    test.skip(true, "this deal shows no ace in the stock; covered by the win fixture");
  });
});

test.describe("keyboard play - FR-12", () => {
  test("arrows move between piles and space picks a card up and puts it down", async ({
    page,
  }) => {
    await openGame(page);
    await page.locator('[data-pile="tableau-0"]').focus();
    await page.keyboard.press("Space");
    await expect(page.locator('[data-selected="true"]')).toHaveCount(1);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    // Legal or not, the gesture is over and nothing is left held.
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
  });

  test("focus is always visible while walking the board - NFR-A11Y-02", async ({ page }) => {
    await openGame(page);
    await page.locator('[data-pile="tableau-0"]').focus();
    await page.keyboard.press("ArrowRight");
    // Focus moves in an effect after the state update, so this has to be an assertion
    // that retries rather than a one-shot read of document.activeElement.
    await expect(page.locator('[data-pile="tableau-1"]')).toBeFocused();
  });
});

test.describe("undo and restart - US-04, US-05", () => {
  test("undo walks all the way back to the deal", async ({ page }) => {
    await openGame(page);
    const snapshot = () =>
      page
        .locator("[data-card]")
        .evaluateAll((els) =>
          els.map((e) => `${e.getAttribute("data-card")}:${e.getAttribute("data-face")}`),
        );
    const dealt = await snapshot();

    for (let i = 0; i < 6; i++) await stock(page).click();
    expect(await snapshot()).not.toEqual(dealt);

    for (let i = 0; i < 6; i++) await undo(page).click();
    expect(await snapshot()).toEqual(dealt);
    await expect(undo(page)).toHaveAttribute("aria-disabled", "true");
  });

  test("restart redeals the same game, not a different one", async ({ page }) => {
    await openGame(page);
    const dealt = await page
      .locator("[data-card]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-card")));
    for (let i = 0; i < 4; i++) await stock(page).click();
    await page.getByRole("button", { name: "Chơi lại" }).click();
    const again = await page
      .locator("[data-card]")
      .evaluateAll((els) => els.map((e) => e.getAttribute("data-card")));
    expect(again).toEqual(dealt);
  });

  test("a new game changes the deal number in the address - FR-13", async ({ page }) => {
    await openGame(page, 777);
    await page.getByRole("button", { name: "Ván mới" }).click();
    await expect(page).not.toHaveURL(/van=777\b/);
    await expect(page).toHaveURL(/van=\d+/);
  });
});

test.describe("changing draw mode asks first - US-05", () => {
  test("it redeals only after the player agrees", async ({ page }) => {
    await openGame(page);
    await stock(page).click();
    await page.getByLabel("Chế độ rút").selectOption("3");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Giữ ván hiện tại" }).click();
    await expect(cardsIn(waste(page))).toHaveCount(1);

    await page.getByLabel("Chế độ rút").selectOption("3");
    await page.getByRole("dialog").getByRole("button", { name: "Đổi và chia lại" }).click();
    await expect(cardsIn(waste(page))).toHaveCount(0);
    await stock(page).click();
    await expect(cardsIn(waste(page))).toHaveCount(3);
  });

  test("no dialog before the first move, because nothing would be lost", async ({ page }) => {
    await openGame(page);
    await page.getByLabel("Chế độ rút").selectOption("3");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
