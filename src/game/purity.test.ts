import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The rules layer is only testable without a browser for as long as it stays free of
 * one, and the day it stops being free is the day this becomes expensive to undo
 * (invariants #1 and #3). Lint says the same thing, but lint is not run by `yarn test`
 * and can be disabled inline - this cannot.
 *
 * Reading the source as text is the point: it catches an import added anywhere in the
 * file, including inside a comment-shaped disable directive.
 */

const GAME_DIR = dirname(fileURLToPath(import.meta.url));

const sourceFiles = readdirSync(GAME_DIR)
  .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
  .map((name) => ({ name, text: readFileSync(join(GAME_DIR, name), "utf8") }));

describe("src/game stays framework-free and deterministic", () => {
  it("finds the source files at all - an empty scan must not pass silently", () => {
    expect(sourceFiles.length).toBeGreaterThanOrEqual(5);
    expect(sourceFiles.map((f) => f.name).sort()).toEqual([
      "auto.ts",
      "cards.ts",
      "deal.ts",
      "moves.ts",
      "rng.ts",
      "state.ts",
    ]);
  });

  it.each(sourceFiles.filter((f) => f.name !== "rng.ts"))(
    "$name never calls Math.random - randomness enters only as a seed",
    ({ text }) => {
      // The call form, not the bare name: a comment explaining the rule is not a breach.
      expect(text).not.toContain("Math.random(");
    },
  );

  it("rng.ts is the only file allowed to, and only inside randomSeed", () => {
    const rng = sourceFiles.find((f) => f.name === "rng.ts");
    expect(rng).toBeDefined();
    const occurrences = rng!.text.split("Math.random(").length - 1;
    expect(occurrences).toBe(1);
    expect(rng!.text).toContain("export function randomSeed");
  });

  it.each(sourceFiles)("$name does not read the clock", ({ text }) => {
    expect(text).not.toContain("Date.now(");
    expect(text).not.toContain("new Date(");
    expect(text).not.toContain("performance.now(");
  });

  it.each(sourceFiles)("$name does not touch the browser", ({ text }) => {
    expect(text).not.toContain("window.");
    expect(text).not.toContain("document.");
    expect(text).not.toContain("localStorage");
    expect(text).not.toContain("fetch(");
  });

  it.each(sourceFiles)("$name imports nothing from react, next or the UI", ({ text }) => {
    const specifiers = [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const specifier of specifiers) {
      expect(specifier).not.toMatch(/^(react|react-dom|next)(\/|$)/);
      expect(specifier).not.toMatch(/^@\/(components|hooks|app|lib)(\/|$)/);
    }
    expect(text).not.toMatch(/require\(\s*["'](react|next)/);
  });

  it.each(sourceFiles)("$name only imports from inside src/game", ({ text }) => {
    const specifiers = [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const specifier of specifiers) {
      expect(specifier.startsWith("./")).toBe(true);
    }
  });
});
