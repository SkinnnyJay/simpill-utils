/**
 * @file TTLCache unit tests
 */

import { TTLCache } from "../../../src/shared/collections/ttl-cache";

describe("TTLCache", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("set and get within TTL", () => {
    const c = new TTLCache<string, number>({ ttlMs: 1000 });
    c.set("a", 1);
    expect(c.get("a")).toBe(1);
  });

  it("returns undefined after TTL", () => {
    const c = new TTLCache<string, number>({ ttlMs: 50 });
    c.set("a", 1);
    jest.advanceTimersByTime(60);
    expect(c.get("a")).toBeUndefined();
  });

  it("has respects TTL", () => {
    const c = new TTLCache<string, number>({ ttlMs: 10000 });
    c.set("a", 1);
    expect(c.has("a")).toBe(true);
    expect(c.has("b")).toBe(false);
  });

  it("delete and clear", () => {
    const c = new TTLCache<string, number>({ ttlMs: 1000 });
    c.set("a", 1);
    expect(c.delete("a")).toBe(true);
    c.set("b", 2);
    c.clear();
    expect(c.get("b")).toBeUndefined();
  });

  it("maxSize evicts oldest when over capacity", () => {
    const c = new TTLCache<string, number>({ ttlMs: 10000, maxSize: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.get("c")).toBe(3);
  });

  it("prunes expired entries on set() so size does not grow unbounded", () => {
    const c = new TTLCache<string, number>({ ttlMs: 50 });
    c.set("a", 1);
    jest.advanceTimersByTime(60);
    c.set("b", 2);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.size).toBe(1);
  });
});

describe("TTLCache (uplift)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("get() refreshes recency so hot keys survive eviction", () => {
    const c = new TTLCache<string, number>({ ttlMs: 10000, maxSize: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.get("a"); // a becomes most recent
    c.set("c", 3); // evicts b, not a
    expect(c.get("a")).toBe(1);
    expect(c.get("b")).toBeUndefined();
    expect(c.get("c")).toBe(3);
  });

  it("has() does not refresh recency and works for stored undefined", () => {
    const c = new TTLCache<string, number | undefined>({ ttlMs: 10000, maxSize: 2 });
    c.set("a", undefined);
    c.set("b", 2);
    expect(c.has("a")).toBe(true); // must not report missing for undefined value
    c.has("a"); // not a touch
    c.set("c", 3); // evicts a (least recent) — has() gave it no protection
    expect(c.has("a")).toBe(false);
    expect(c.has("b")).toBe(true);
  });

  it("set() on an existing key refreshes recency (true LRU)", () => {
    const c = new TTLCache<string, number>({ ttlMs: 10000, maxSize: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("a", 10); // a most recent now
    c.set("c", 3); // evicts b
    expect(c.get("a")).toBe(10);
    expect(c.get("b")).toBeUndefined();
  });

  it("peek() reads without touching recency", () => {
    const c = new TTLCache<string, number>({ ttlMs: 10000, maxSize: 2 });
    c.set("a", 1);
    c.set("b", 2);
    expect(c.peek("a")).toBe(1);
    c.set("c", 3); // evicts a despite the peek
    expect(c.peek("a")).toBeUndefined();
  });

  it("getRemainingTTL reports lifetime and expiry", () => {
    const c = new TTLCache<string, number>({ ttlMs: 100 });
    c.set("a", 1);
    jest.advanceTimersByTime(40);
    expect(c.getRemainingTTL("a")).toBe(60);
    jest.advanceTimersByTime(70);
    expect(c.getRemainingTTL("a")).toBeUndefined();
    expect(c.getRemainingTTL("missing")).toBeUndefined();
  });

  it("entries/keys/values iterate live entries only, LRU first", () => {
    const c = new TTLCache<string, number>({ ttlMs: 50, maxSize: 10 });
    c.set("old", 0);
    jest.advanceTimersByTime(60); // old expires
    c.set("a", 1);
    c.set("b", 2);
    c.get("a"); // a most recent -> order b, a
    expect([...c.entries()]).toEqual([
      ["b", 2],
      ["a", 1],
    ]);
    expect([...c.keys()]).toEqual(["b", "a"]);
    expect([...c.values()]).toEqual([2, 1]);
    expect([...c]).toEqual([...c.entries()]);
  });

  it("agrees with a naive model over a randomized op sequence", () => {
    const c = new TTLCache<number, number>({ ttlMs: 1000 });
    const model = new Map<number, { value: number; expiresAt: number }>();
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 2000; i++) {
      const key = Math.floor(rand() * 20);
      const op = rand();
      if (op < 0.5) {
        c.set(key, i);
        model.set(key, { value: i, expiresAt: Date.now() + 1000 });
      } else if (op < 0.8) {
        const e = model.get(key);
        const expected = e && Date.now() <= e.expiresAt ? e.value : undefined;
        expect(c.get(key)).toBe(expected);
      } else if (op < 0.9) {
        c.delete(key);
        model.delete(key);
      } else {
        jest.advanceTimersByTime(Math.floor(rand() * 300));
      }
    }
  });
});
