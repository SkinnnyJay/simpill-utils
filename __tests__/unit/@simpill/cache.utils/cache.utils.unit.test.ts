import { describe, expect, it } from "vitest";
import * as Cache from "@simpill/cache.utils";

describe("@simpill/cache.utils", () => {
  it("resolves and exports cache utilities", () => {
    expect(Cache).toBeDefined();
    expect(typeof Cache).toBe("object");
    const keys = Object.keys(Cache).filter((k) => (Cache as Record<string, unknown>)[k] != null);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("exposes a memoize or createMemoize-like function when present", () => {
    const C = Cache as Record<string, unknown>;
    const memoizeFn = C.memoize ?? C.createMemoize;
    if (typeof memoizeFn !== "function") return;
    const double = (n: number) => n * 2;
    const memoized = (memoizeFn as (fn: (n: number) => number) => (n: number) => number)(double);
    expect(memoized(2)).toBe(4);
    expect(memoized(2)).toBe(4);
  });
});
