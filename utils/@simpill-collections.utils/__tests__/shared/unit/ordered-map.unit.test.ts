/**
 * @file OrderedMap unit tests
 */

import { OrderedMap } from "../../../src/shared/collections/ordered-map";

describe("OrderedMap", () => {
  it("set and get preserve order", () => {
    const m = new OrderedMap<string, number>();
    m.set("c", 3);
    m.set("a", 1);
    m.set("b", 2);
    expect(m.getAt(0)).toEqual(["c", 3]);
    expect(m.getAt(1)).toEqual(["a", 1]);
    expect(m.getAt(2)).toEqual(["b", 2]);
  });

  it("keyAt and valueAt", () => {
    const m = new OrderedMap<string, number>();
    m.set("x", 10);
    m.set("y", 20);
    expect(m.keyAt(0)).toBe("x");
    expect(m.valueAt(1)).toBe(20);
  });

  it("delete removes from order", () => {
    const m = new OrderedMap<string, number>();
    m.set("a", 1);
    m.set("b", 2);
    m.delete("a");
    expect(m.getAt(0)).toEqual(["b", 2]);
  });

  it("entries iteration order", () => {
    const m = new OrderedMap<string, number>();
    m.set("a", 1);
    m.set("b", 2);
    expect([...m.entries()]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("get set has clear", () => {
    const m = new OrderedMap<string, number>();
    m.set("x", 10);
    expect(m.get("x")).toBe(10);
    expect(m.has("x")).toBe(true);
    m.set("x", 20);
    expect(m.get("x")).toBe(20);
    m.clear();
    expect(m.size).toBe(0);
    expect(m.get("x")).toBeUndefined();
  });

  it("getAt keyAt valueAt out of range", () => {
    const m = new OrderedMap<string, number>();
    m.set("a", 1);
    expect(m.getAt(1)).toBeUndefined();
    expect(m.keyAt(-1)).toBeUndefined();
    expect(m.valueAt(5)).toBeUndefined();
  });

  it("delete returns false for missing key", () => {
    const m = new OrderedMap<string, number>();
    m.set("a", 1);
    expect(m.delete("b")).toBe(false);
    expect(m.size).toBe(1);
  });

  it("keys and values iterators", () => {
    const m = new OrderedMap<string, number>();
    m.set("a", 1);
    m.set("b", 2);
    expect([...m.keys()]).toEqual(["a", "b"]);
    expect([...m.values()]).toEqual([1, 2]);
    expect([...m]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });
});
