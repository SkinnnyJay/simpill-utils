/**
 * @file LRUCache unit tests
 */

import { LRUCache } from "../../../src/shared/collections/lru-cache";

describe("LRUCache", () => {
  it("throws when maxSize < 1", () => {
    expect(() => new LRUCache(0)).toThrow(RangeError);
  });

  it("set and get", () => {
    const c = new LRUCache<string, number>(10);
    c.set("a", 1);
    expect(c.get("a")).toBe(1);
    expect(c.has("a")).toBe(true);
    expect(c.has("b")).toBe(false);
  });

  it("evicts LRU when full", () => {
    const c = new LRUCache<string, number>(2);
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.get("c")).toBe(3);
  });

  it("get touches and prevents eviction", () => {
    const c = new LRUCache<string, number>(2);
    c.set("a", 1);
    c.set("b", 2);
    c.get("a");
    c.set("c", 3);
    expect(c.get("a")).toBe(1);
    expect(c.get("b")).toBeUndefined();
  });

  it("delete and clear", () => {
    const c = new LRUCache<string, number>(5);
    c.set("a", 1);
    expect(c.delete("a")).toBe(true);
    expect(c.get("a")).toBeUndefined();
    c.set("b", 2);
    c.clear();
    expect(c.size).toBe(0);
  });

  it("set updates existing key without evicting", () => {
    const c = new LRUCache<string, number>(2);
    c.set("a", 1);
    c.set("b", 2);
    c.set("a", 10);
    expect(c.get("a")).toBe(10);
    expect(c.get("b")).toBe(2);
  });

  it("options object constructor", () => {
    const c = new LRUCache<string, number>({ maxSize: 3 });
    c.set("x", 1);
    expect(c.maxSize).toBe(3);
    expect(c.get("x")).toBe(1);
  });
});

describe("LRUCache (uplift)", () => {
  it("peek() reads without refreshing recency", () => {
    const c = new LRUCache<string, number>(2);
    c.set("a", 1);
    c.set("b", 2);
    expect(c.peek("a")).toBe(1);
    c.set("c", 3); // evicts a despite the peek
    expect(c.peek("a")).toBeUndefined();
    expect(c.peek("b")).toBe(2);
  });

  it("iterates most-recently-used first (mnemonist convention)", () => {
    const c = new LRUCache<string, number>(3);
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    c.get("a"); // a most recent
    expect([...c.entries()]).toEqual([
      ["a", 1],
      ["c", 3],
      ["b", 2],
    ]);
    expect([...c.keys()]).toEqual(["a", "c", "b"]);
    expect([...c.values()]).toEqual([1, 3, 2]);
    expect([...c]).toEqual([...c.entries()]);
    const seen: string[] = [];
    c.forEach((_v, k) => {
      seen.push(k);
    });
    expect(seen).toEqual(["a", "c", "b"]);
  });
});
