import { memoize } from "../../../src/shared/memoize";

describe("memoize extended", () => {
  it("exposes .cache for invalidation", () => {
    let calls = 0;
    const fn = memoize((x: number) => {
      calls++;
      return x * 2;
    });
    expect(fn(2)).toBe(4);
    expect(fn(2)).toBe(4);
    expect(calls).toBe(1);
    fn.cache.delete?.(2);
    expect(fn(2)).toBe(4);
    expect(calls).toBe(2);
  });

  it("caches undefined return values (calls once)", () => {
    let calls = 0;
    const fn = memoize((_x: number) => {
      calls++;
      return undefined;
    });
    fn(1);
    fn(1);
    expect(calls).toBe(1);
  });
});
