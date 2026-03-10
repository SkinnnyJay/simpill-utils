/**
 * @file BoundedArray unit tests
 */

import { BoundedArray } from "../../../src/shared/bounded-array";

describe("BoundedArray", () => {
  it("throws when maxSize <= 0", () => {
    expect(() => new BoundedArray(0)).toThrow("maxSize must be greater than 0");
    expect(() => new BoundedArray({ maxSize: -1 })).toThrow("maxSize must be greater than 0");
  });

  it("accepts number constructor", () => {
    const arr = new BoundedArray<number>(3);
    arr.push(1);
    arr.push(2);
    expect(arr.length).toBe(2);
    expect(arr.toArray()).toEqual([1, 2]);
  });

  it("evicts oldest on push when at capacity", () => {
    const arr = new BoundedArray<number>(3);
    arr.push(1);
    arr.push(2);
    arr.push(3);
    arr.push(4);
    expect(arr.length).toBe(3);
    expect(arr.toArray()).toEqual([2, 3, 4]);
  });

  it("getStats reports evictions", () => {
    const arr = new BoundedArray<number>(2);
    arr.push(1);
    arr.push(2);
    arr.push(3);
    const stats = arr.getStats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(2);
    expect(stats.evictions).toBe(1);
  });

  it("unshift evicts from end when over capacity", () => {
    const arr = new BoundedArray<number>(3);
    arr.unshift(1);
    arr.unshift(2);
    arr.unshift(3);
    arr.unshift(4);
    expect(arr.length).toBe(3);
    expect(arr.toArray()).toEqual([4, 3, 2]);
  });

  it("clear resets length and evictions", () => {
    const arr = new BoundedArray<number>(2);
    arr.push(1);
    arr.push(2);
    arr.push(3);
    arr.clear();
    expect(arr.length).toBe(0);
    expect(arr.getStats().evictions).toBe(0);
  });

  it("works without logger", () => {
    const arr = new BoundedArray<string>(2);
    arr.push("a");
    arr.push("b");
    arr.push("c");
    expect(arr.toArray()).toEqual(["b", "c"]);
  });
});
