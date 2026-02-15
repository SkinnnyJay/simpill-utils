/**
 * @file BoundedLRUMap unit tests
 */

import { BoundedLRUMap } from "../../../src/shared/bounded-lru-map";

describe("BoundedLRUMap", () => {
  it("throws when maxSize <= 0", () => {
    expect(() => new BoundedLRUMap(0)).toThrow("maxSize must be greater than 0");
    expect(() => new BoundedLRUMap({ maxSize: -1 })).toThrow("maxSize must be greater than 0");
  });

  it("accepts number constructor", () => {
    const map = new BoundedLRUMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    expect(map.size).toBe(2);
    expect(map.get("a")).toBe(1);
  });

  it("evicts oldest entry when over capacity", () => {
    const map = new BoundedLRUMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    expect(map.size).toBe(2);
    expect(map.has("a")).toBe(false);
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(3);
  });

  it("get moves key to end (LRU)", () => {
    const map = new BoundedLRUMap<string, number>(3);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    map.get("a");
    map.set("d", 4);
    expect(map.has("b")).toBe(false);
    expect(map.has("a")).toBe(true);
    expect(map.has("c")).toBe(true);
    expect(map.has("d")).toBe(true);
  });

  it("getStats returns size and evictions", () => {
    const map = new BoundedLRUMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    const stats = map.getStats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(2);
    expect(stats.evictions).toBe(1);
  });

  it("clear resets map and evictions", () => {
    const map = new BoundedLRUMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    map.clear();
    expect(map.size).toBe(0);
    expect(map.getStats().evictions).toBe(0);
  });

  it("works without logger (no alerts)", () => {
    const map = new BoundedLRUMap<string, number>(2);
    map.set("x", 1);
    map.set("y", 2);
    map.set("z", 3);
    expect(map.get("z")).toBe(3);
  });
});
