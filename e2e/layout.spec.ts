import { expect, test } from "@playwright/test";
import { openGame, tableau } from "./helpers";

/**
 * These run at all four project viewports, so each assertion is really four - which is
 * the point: FR-11 promises the board fits from 320px up, and a promise made at one
 * width is not a promise.
 */
test.describe("the board fits its viewport", () => {
  test("never scrolls sideways - FR-11", async ({ page }) => {
    await openGame(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("every card offers a 44px touch target - NFR-A11Y-03", async ({ page }) => {
    await openGame(page);
    const boxes = await page.locator("[data-hit-area]").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }),
    );
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.w).toBeGreaterThanOrEqual(44);
      expect(box.h).toBeGreaterThanOrEqual(44);
    }
  });

  test("every toolbar control is at least 44px tall - NFR-A11Y-03", async ({ page }) => {
    await openGame(page);
    const controls = page.getByRole("toolbar").locator("button, select");
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test("the seven columns stay inside the viewport", async ({ page }) => {
    await openGame(page);
    const width = page.viewportSize()?.width ?? 0;
    const last = await tableau(page, 6).boundingBox();
    const first = await tableau(page, 0).boundingBox();
    expect(first?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeLessThanOrEqual(width);
  });
});
