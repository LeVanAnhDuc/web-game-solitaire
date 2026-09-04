import { defineConfig, devices } from "@playwright/test";

const PORT = 4183;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * The e2e suite runs against the STATIC EXPORT, not a dev server: that is what
 * GitHub Pages will serve, so it is what gets tested. `next start` cannot serve an
 * exported site, hence scripts/serve.mjs over `out/`.
 *
 * The four viewports are the widths FR-11 promises to support; 320 is the narrowest
 * width the layout claims, so it is a project rather than a one-off assertion.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile-320", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 720 } } },
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 720 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 900 } } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `node scripts/serve.mjs ${PORT} out`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
