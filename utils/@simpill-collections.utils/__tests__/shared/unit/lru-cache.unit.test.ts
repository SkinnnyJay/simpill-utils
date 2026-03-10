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
