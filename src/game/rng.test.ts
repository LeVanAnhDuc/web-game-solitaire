import { describe, expect, it } from "vitest";
import { mulberry32, randomSeed, shuffle } from "./rng";

const take = (n: number, rng: () => number): number[] =>
  Array.from({ length: n }, () => rng());

describe("mulberry32", () => {
  it("gives the same sequence for the same seed", () => {
    expect(take(20, mulberry32(12345))).toEqual(take(20, mulberry32(12345)));
  });

  it("gives different sequences for different seeds", () => {
    expect(take(20, mulberry32(1))).not.toEqual(take(20, mulberry32(2)));
  });

  it("stays inside [0, 1)", () => {
    for (const value of take(500, mulberry32(99))) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("does not immediately repeat itself", () => {
    const values = take(200, mulberry32(7));
    expect(new Set(values).size).toBe(values.length);
  });

  it("treats a seed of 0 as a real seed rather than a missing one", () => {
    expect(take(5, mulberry32(0))).not.toEqual(take(5, mulberry32(1)));
  });
});

describe("shuffle", () => {
  const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  it("does not mutate its input", () => {
    const before = [...input];
    shuffle(input, mulberry32(42));
    expect([...input]).toEqual(before);
  });

  it("returns a new array", () => {
    const out = shuffle(input, mulberry32(42));
    expect(out).not.toBe(input);
  });

  it("is a permutation - same items, no loss, no duplication", () => {
    const out = shuffle(input, mulberry32(4242));
    expect(out.length).toBe(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual([...input]);
  });

  it("gives the same permutation for the same seed", () => {
    expect(shuffle(input, mulberry32(2026))).toEqual(shuffle(input, mulberry32(2026)));
  });

  it("gives different permutations for different seeds", () => {
    expect(shuffle(input, mulberry32(1))).not.toEqual(shuffle(input, mulberry32(2)));
  });

  it("handles empty and single-item arrays", () => {
    expect(shuffle([], mulberry32(1))).toEqual([]);
    expect(shuffle(["a"], mulberry32(1))).toEqual(["a"]);
  });
});

describe("randomSeed", () => {
  it("returns a non-negative integer", () => {
    for (let i = 0; i < 50; i++) {
      const seed = randomSeed();
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
    }
  });

  it("does not return the same value every time", () => {
    const seeds = new Set(Array.from({ length: 50 }, () => randomSeed()));
    expect(seeds.size).toBeGreaterThan(1);
  });
});
