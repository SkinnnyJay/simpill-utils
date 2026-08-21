import { TTLCache } from "../../../src/server/ttl-cache";

describe("TTLCache extended", () => {
  afterEach(() => jest.useRealTimers());

  it("supports delete()", () => {
    const c = new TTLCache<string, number>(1000);
    c.set("a", 1);
    expect(c.delete("a")).toBe(true);
    expect(c.delete("a")).toBe(false);
    expect(c.get("a")).toBeUndefined();
  });

  it("supports optional maxSize with oldest-first eviction", () => {
    const c = new TTLCache<string, number>(60_000, { maxSize: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    expect(c.size).toBe(2);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.get("c")).toBe(3);
    expect(() => new TTLCache(1000, { maxSize: 0 })).toThrow();
  });

  it("rejects NaN ttlMs", () => {
    expect(() => new TTLCache(Number.NaN)).toThrow();
  });

  it("re-set of an existing key refreshes its TTL and keeps prune order correct", () => {
    jest.useFakeTimers().setSystemTime(0);
    const c = new TTLCache<string, number>(100);
    c.set("a", 1); // expires 100
    jest.setSystemTime(50);
    c.set("b", 2); // expires 150
    c.set("a", 10); // re-set: expires 150... a moved behind b
    jest.setSystemTime(120); // b NOT expired (150), a NOT expired (150)
    expect(c.get("b")).toBe(2);
    expect(c.get("a")).toBe(10);
    jest.setSystemTime(200);
    expect(c.size).toBe(0);
  });

  it("front-pop prune removes ALL expired entries even after re-sets", () => {
    jest.useFakeTimers().setSystemTime(0);
    const c = new TTLCache<string, number>(100);
    c.set("a", 1);
    c.set("b", 2);
    jest.setSystemTime(60);
    c.set("a", 3); // moved to back with expiry 160
    jest.setSystemTime(130); // b expired (100), a live (160)
    c.set("c", 4); // triggers prune
    expect(c.size).toBe(2); // a + c; b physically pruned
    expect(c.get("b")).toBeUndefined();
    expect(c.get("a")).toBe(3);
  });

  it("getRemainingTTL reports remaining ms", () => {
    jest.useFakeTimers().setSystemTime(0);
    const c = new TTLCache<string, number>(500);
    c.set("a", 1);
    jest.setSystemTime(200);
    expect(c.getRemainingTTL("a")).toBe(300);
    jest.setSystemTime(600);
    expect(c.getRemainingTTL("a")).toBeUndefined();
  });
});
