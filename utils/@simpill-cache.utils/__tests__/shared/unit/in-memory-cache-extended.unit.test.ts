import { InMemoryCache } from "../../../src/shared/in-memory-cache.utils";

describe("InMemoryCache extended", () => {
  afterEach(() => jest.useRealTimers());

  it("rejects NaN TTLs (previously created immortal entries)", () => {
    expect(() => new InMemoryCache({ defaultTtlMs: Number.NaN })).toThrow();
    const c = new InMemoryCache<string, number>();
    expect(() => c.set("k", 1, Number.NaN)).toThrow();
  });

  it("size getter physically removes expired entries (memory reclaim)", () => {
    jest.useFakeTimers().setSystemTime(0);
    const c = new InMemoryCache<string, number>({ defaultTtlMs: 100 });
    for (let i = 0; i < 50; i++) c.set(`k${i}`, i);
    jest.setSystemTime(1000);
    expect(c.size).toBe(0);
    // Internal map must be empty now, not just filtered from the count.
    expect((c as unknown as { store: Map<string, unknown> })["store"].size).toBe(0);
  });

  it("capacity sweep prefers expired garbage over evicting live LRU entries", () => {
    jest.useFakeTimers().setSystemTime(0);
    const c = new InMemoryCache<string, number>({ maxSize: 3 });
    c.set("dead", 0, 10);
    c.set("live1", 1);
    c.set("live2", 2);
    jest.setSystemTime(50); // "dead" expired
    c.set("live3", 3); // at capacity: must reclaim "dead", keep live1/live2
    expect(c.get("live1")).toBe(1);
    expect(c.get("live2")).toBe(2);
    expect(c.get("live3")).toBe(3);
  });

  it("getRemainingTTL reports remaining ms, Infinity without TTL, undefined when gone", () => {
    jest.useFakeTimers().setSystemTime(0);
    const c = new InMemoryCache<string, number>();
    c.set("ttl", 1, 1000);
    c.set("forever", 2);
    expect(c.getRemainingTTL("ttl")).toBe(1000);
    expect(c.getRemainingTTL("forever")).toBe(Number.POSITIVE_INFINITY);
    expect(c.getRemainingTTL("missing")).toBeUndefined();
    jest.setSystemTime(2000);
    expect(c.getRemainingTTL("ttl")).toBeUndefined();
  });

  it("keys() yields only live keys", () => {
    jest.useFakeTimers().setSystemTime(0);
    const c = new InMemoryCache<string, number>({ defaultTtlMs: 100 });
    c.set("a", 1);
    c.set("b", 2, 10_000);
    jest.setSystemTime(500);
    expect([...c.keys()]).toEqual(["b"]);
  });
});
