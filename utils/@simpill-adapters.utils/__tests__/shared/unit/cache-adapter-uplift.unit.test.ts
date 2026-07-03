import { memoryCacheAdapter, noopCacheAdapter } from "../../../src/shared/cache-adapter";

describe("memoryCacheAdapter backward compatibility (model-based)", () => {
  it("with no options behaves identically to a plain Map over 5000 random ops", () => {
    // Seeded LCG so failures reproduce.
    let seed = 0xc0ffee;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const cache = memoryCacheAdapter<string, number | undefined>();
    const model = new Map<string, number | undefined>();
    const keys = Array.from({ length: 30 }, (_, i) => `k${i}`);
    for (let i = 0; i < 5000; i++) {
      const key = keys[Math.floor(rand() * keys.length)];
      const op = Math.floor(rand() * 4);
      if (op === 0) {
        const value = rand() < 0.1 ? undefined : Math.floor(rand() * 100);
        cache.set(key, value);
        model.set(key, value);
      } else if (op === 1) {
        expect(cache.get(key)).toBe(model.get(key));
      } else if (op === 2) {
        expect(cache.has(key)).toBe(model.has(key));
      } else {
        expect(cache.delete(key)).toBe(model.delete(key));
      }
    }
    expect(cache.keys().sort()).toEqual([...model.keys()].sort());
  });

  it("distinguishes stored undefined from missing via has()", () => {
    const cache = memoryCacheAdapter<string, undefined>();
    cache.set("u", undefined);
    expect(cache.get("u")).toBeUndefined();
    expect(cache.has("u")).toBe(true);
    expect(cache.has("missing")).toBe(false);
  });
});

describe("memoryCacheAdapter TTL", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("expires entries lazily after default ttlMs", () => {
    const cache = memoryCacheAdapter<string, string>({ ttlMs: 100 });
    cache.set("a", "x");
    expect(cache.get("a")).toBe("x");
    jest.advanceTimersByTime(99);
    expect(cache.has("a")).toBe(true);
    jest.advanceTimersByTime(2);
    expect(cache.has("a")).toBe(false);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.keys()).toEqual([]);
  });

  it("per-set ttlMs overrides the default", () => {
    const cache = memoryCacheAdapter<string, string>({ ttlMs: 10 });
    cache.set("long", "x", 1000);
    jest.advanceTimersByTime(500);
    expect(cache.get("long")).toBe("x");
    jest.advanceTimersByTime(501);
    expect(cache.get("long")).toBeUndefined();
  });

  it("re-setting a key refreshes its ttl", () => {
    const cache = memoryCacheAdapter<string, number>({ ttlMs: 100 });
    cache.set("a", 1);
    jest.advanceTimersByTime(80);
    cache.set("a", 2);
    jest.advanceTimersByTime(80);
    expect(cache.get("a")).toBe(2);
  });

  it("fires onEvict with reason 'expired' on lazy expiry", () => {
    const onEvict = jest.fn();
    const cache = memoryCacheAdapter<string, string>({ ttlMs: 50, onEvict });
    cache.set("a", "x");
    jest.advanceTimersByTime(51);
    cache.get("a");
    expect(onEvict).toHaveBeenCalledWith("a", "x", "expired");
  });

  it("rejects NaN, zero, negative, and Infinity ttls (no immortal-entry footgun)", () => {
    const cache = memoryCacheAdapter<string, number>();
    expect(() => cache.set("a", 1, Number.NaN)).toThrow(RangeError);
    expect(() => cache.set("a", 1, 0)).toThrow(RangeError);
    expect(() => cache.set("a", 1, -5)).toThrow(RangeError);
    expect(() => cache.set("a", 1, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => memoryCacheAdapter({ ttlMs: Number.NaN })).toThrow(RangeError);
  });
});

describe("memoryCacheAdapter LRU (maxSize)", () => {
  it("evicts the least-recently-used entry at capacity", () => {
    const cache = memoryCacheAdapter<string, number>({ maxSize: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // touch a -> b is now LRU
    cache.set("c", 3);
    expect(cache.has("b")).toBe(false);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("fires onEvict with reason 'evicted' on capacity eviction", () => {
    const onEvict = jest.fn();
    const cache = memoryCacheAdapter<string, number>({ maxSize: 1, onEvict });
    cache.set("a", 1);
    cache.set("b", 2);
    expect(onEvict).toHaveBeenCalledWith("a", 1, "evicted");
    expect(cache.keys()).toEqual(["b"]);
  });

  it("re-setting an existing key does not evict others", () => {
    const cache = memoryCacheAdapter<string, number>({ maxSize: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("a")).toBe(10);
  });

  it("rejects invalid maxSize", () => {
    expect(() => memoryCacheAdapter({ maxSize: 0 })).toThrow(RangeError);
    expect(() => memoryCacheAdapter({ maxSize: 1.5 })).toThrow(RangeError);
  });
});

describe("memoryCacheAdapter batch ops and clear", () => {
  it("getMany/setMany/deleteMany/clear/keys round-trip", () => {
    const cache = memoryCacheAdapter<string, number>();
    cache.setMany([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    expect(cache.getMany(["a", "b", "zz"])).toEqual([1, 2, undefined]);
    expect(cache.keys().sort()).toEqual(["a", "b"]);
    expect(cache.deleteMany(["a", "zz"])).toEqual([true, false]);
    cache.clear();
    expect(cache.keys()).toEqual([]);
  });
});

describe("noopCacheAdapter", () => {
  it("stores nothing and reports accordingly", () => {
    const cache = noopCacheAdapter<string, number>();
    cache.set("a", 1);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.has("a")).toBe(false);
    expect(cache.delete("a")).toBe(false);
    expect(cache.getMany?.(["a", "b"])).toEqual([undefined, undefined]);
    expect(cache.deleteMany?.(["a"])).toEqual([false]);
    expect(cache.keys?.()).toEqual([]);
  });
});
