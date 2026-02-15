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
