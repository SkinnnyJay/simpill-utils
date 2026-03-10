/**
 * @file BiMap unit tests
 */

import { BiMap } from "../../../src/shared/collections/bi-map";

describe("BiMap", () => {
  it("set getByKey getByValue", () => {
    const b = new BiMap<string, number>();
    b.set("a", 1);
    expect(b.getByKey("a")).toBe(1);
    expect(b.getByValue(1)).toBe("a");
  });

  it("hasKey and hasValue", () => {
    const b = new BiMap<string, number>();
    b.set("x", 10);
    expect(b.hasKey("x")).toBe(true);
    expect(b.hasValue(10)).toBe(true);
    expect(b.hasKey("y")).toBe(false);
  });

  it("set overwrites by key and by value", () => {
    const b = new BiMap<string, number>();
    b.set("a", 1);
    b.set("a", 2);
    expect(b.getByKey("a")).toBe(2);
    expect(b.getByValue(1)).toBeUndefined();
    b.set("b", 2);
    expect(b.getByKey("a")).toBeUndefined();
    expect(b.getByValue(2)).toBe("b");
  });

  it("deleteByKey and deleteByValue", () => {
    const b = new BiMap<string, number>();
    b.set("a", 1);
    expect(b.deleteByKey("a")).toBe(true);
    expect(b.getByValue(1)).toBeUndefined();
    b.set("b", 2);
    expect(b.deleteByValue(2)).toBe(true);
    expect(b.getByKey("b")).toBeUndefined();
  });

  it("keys and values iterators", () => {
    const b = new BiMap<string, number>();
    b.set("a", 1);
    b.set("b", 2);
    expect([...b.keys()].sort()).toEqual(["a", "b"]);
    expect([...b.values()].sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it("clear", () => {
    const b = new BiMap<string, number>();
    b.set("a", 1);
    b.clear();
    expect(b.size).toBe(0);
    expect(b.getByKey("a")).toBeUndefined();
  });
});
