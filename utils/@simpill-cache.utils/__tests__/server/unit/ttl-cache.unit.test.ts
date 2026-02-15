import { TTLCache } from "../../../src/server/ttl-cache";

describe("TTLCache", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("returns undefined after TTL", () => {
    const cache = new TTLCache<string, number>(100);
    cache.set("k", 1);
    expect(cache.get("k")).toBe(1);
    jest.advanceTimersByTime(101);
    expect(cache.get("k")).toBeUndefined();
  });

  it("prunes expired entries on set() so size does not grow unbounded", () => {
    const cache = new TTLCache<string, number>(100);
    cache.set("a", 1);
    jest.advanceTimersByTime(101);
    cache.set("b", 2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.size).toBe(1);
  });
});
