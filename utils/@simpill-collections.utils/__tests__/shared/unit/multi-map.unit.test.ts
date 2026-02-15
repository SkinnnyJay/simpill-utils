/**
 * @file MultiMap unit tests
 */

import { MultiMap } from "../../../src/shared/collections/multi-map";

describe("MultiMap", () => {
  it("add and get", () => {
    const m = new MultiMap<string, number>();
    m.add("a", 1);
    m.add("a", 2);
    expect(m.get("a")).toEqual([1, 2]);
    expect(m.get("b")).toEqual([]);
  });

  it("set replaces values for key", () => {
    const m = new MultiMap<string, number>();
    m.add("a", 1);
    m.set("a", [10, 20]);
    expect(m.get("a")).toEqual([10, 20]);
  });

  it("has and hasEntry", () => {
    const m = new MultiMap<string, number>();
    m.add("a", 1);
    expect(m.has("a")).toBe(true);
    expect(m.hasEntry("a", 1)).toBe(true);
    expect(m.hasEntry("a", 2)).toBe(false);
  });

  it("deleteEntry and delete", () => {
    const m = new MultiMap<string, number>();
    m.add("a", 1);
    m.add("a", 2);
    m.deleteEntry("a", 1);
    expect(m.get("a")).toEqual([2]);
    m.delete("a");
    expect(m.has("a")).toBe(false);
  });

  it("set empty array removes key", () => {
    const m = new MultiMap<string, number>();
    m.add("a", 1);
    m.set("a", []);
    expect(m.get("a")).toEqual([]);
    expect(m.has("a")).toBe(false);
  });

  it("keys values entries iterator", () => {
    const m = new MultiMap<string, number>();
    m.add("a", 1);
    m.add("b", 2);
    expect([...m.keys()]).toEqual(["a", "b"]);
    expect([...m.values()]).toEqual([[1], [2]]);
    expect([...m.entries()]).toEqual([
      ["a", [1]],
      ["b", [2]],
    ]);
    expect([...m]).toEqual([
      ["a", [1]],
      ["b", [2]],
    ]);
  });

  it("deleteEntry returns false when key or value missing", () => {
    const m = new MultiMap<string, number>();
    m.add("a", 1);
    expect(m.deleteEntry("b", 1)).toBe(false);
    expect(m.deleteEntry("a", 2)).toBe(false);
    expect(m.deleteEntry("a", 1)).toBe(true);
  });
});
