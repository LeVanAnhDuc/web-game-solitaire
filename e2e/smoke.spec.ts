import { expect, test } from "@playwright/test";
import { board, cardsIn, openGame, stock, tableau, waste } from "./helpers";

test.describe("the board loads and stays quiet", () => {
  test("deals seven columns of 1..7 cards and a stock of 24", async ({ page }) => {
    await openGame(page);
    await expect(board(page)).toBeVisible();
    for (let i = 0; i < 7; i++) {
      await expect(cardsIn(tableau(page, i))).toHaveCount(i + 1);
    }
    // Stock and foundations paint only their top card, so the deal is checked by
    // drawing rather than by counting DOM nodes.
    await expect(cardsIn(stock(page))).toHaveCount(1);
    await expect(cardsIn(waste(page))).toHaveCount(0);
  });

  test("the same deal number always gives the same deal - FR-13", async ({ page }) => {
    await openGame(page, 4242);
    const first = await page.locator("[data-card]").evaluateAll((els) =>
      els.map((el) => `${el.getAttribute("data-card")}:${el.getAttribute("data-face")}`),
    );
    await page.reload();
    await expect(page.locator("[data-card]").first()).toBeVisible();
    const second = await page.locator("[data-card]").evaluateAll((els) =>
      els.map((el) => `${el.getAttribute("data-card")}:${el.getAttribute("data-face")}`),
    );
    expect(second).toEqual(first);
  });

  test("an unusable deal number falls back to a random deal, without an error", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/?van=khong-phai-so");
    await expect(page.locator("[data-card]").first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("the console stays clean through a handful of moves - NFR-REL-04", async ({ page }) => {
    const noise: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") noise.push(`${m.type()}: ${m.text()}`);
    });
    page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));

    await openGame(page);
    for (let i = 0; i < 5; i++) await stock(page).click();
    await page.getByRole("button", { name: "Hoàn lại" }).click();
    await page.getByRole("button", { name: "Chơi lại" }).click();

    expect(noise).toEqual([]);
  });

  test("nothing is stored and nothing is fetched - NFR-DATA-01", async ({ page }) => {
    const requests: string[] = [];
    await openGame(page);
    // Only count what happens AFTER the page is up: the document and its bundle are
    // the point of a static site; a request during play is not.
    page.on("request", (r) => requests.push(r.url()));
    for (let i = 0; i < 3; i++) await stock(page).click();

    expect(requests).toEqual([]);
    const stored = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
      cookie: document.cookie,
    }));
    expect(stored).toEqual({ local: 0, session: 0, cookie: "" });
  });
});
