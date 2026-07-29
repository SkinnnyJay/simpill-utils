import { memoize } from "../../../src/shared/memoize";

describe("memoize", () => {
  it("caches by first argument", () => {
    const fn = jest.fn((x: number) => x * 2);
    const m = memoize(fn);
    expect(m(2)).toBe(4);
    expect(m(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should evict oldest entries when default LRU limit (1000) is exceeded", () => {
    const fn = jest.fn((x: number) => x * 2);
    const m = memoize(fn);

    for (let i = 0; i < 1001; i++) {
      m(i);
    }
    expect(fn).toHaveBeenCalledTimes(1001);

    // key 0 should have been evicted; calling m(0) must invoke fn again
    fn.mockClear();
    m(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
