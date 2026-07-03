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

describe("BiMap (uplift)", () => {
  it("does not collide distinct keys that stringify identically (1 vs '1')", () => {
    const m = new BiMap<number | string, string>();
    m.set(1, "num");
    m.set("1", "str");
    expect(m.size).toBe(2); // previously the second set overwrote the first
    expect(m.getByKey(1)).toBe("num");
    expect(m.getByKey("1")).toBe("str");
  });

  it("does not collide distinct anonymous symbols", () => {
    const s1 = Symbol();
    const s2 = Symbol();
    const m = new BiMap<symbol, number>();
    m.set(s1, 1);
    m.set(s2, 2);
    expect(m.size).toBe(2);
    expect(m.getByKey(s1)).toBe(1);
    expect(m.getByKey(s2)).toBe(2);
  });

  it("uses reference identity for objects with no options (SameValueZero)", () => {
    const a = { id: 1 };
    const b = { id: 1 };
    const m = new BiMap<object, string>();
    m.set(a, "a");
    m.set(b, "b");
    expect(m.size).toBe(2);
    expect(m.getByKey(a)).toBe("a");
    expect(m.getByKey(b)).toBe("b");
  });

  it("honors equalsKey/equalsValue (previously declared but ignored)", () => {
    const m = new BiMap<{ id: number }, { code: string }>({
      equalsKey: (a, b) => a.id === b.id,
      equalsValue: (a, b) => a.code === b.code,
    });
    m.set({ id: 1 }, { code: "x" });
    expect(m.hasKey({ id: 1 })).toBe(true);
    expect(m.getByKey({ id: 1 })).toEqual({ code: "x" });
    expect(m.getByValue({ code: "x" })).toEqual({ id: 1 });
    m.set({ id: 1 }, { code: "y" }); // same key by equality -> replaces
    expect(m.size).toBe(1);
    expect(m.getByKey({ id: 1 })).toEqual({ code: "y" });
    expect(m.deleteByValue({ code: "y" })).toBe(true);
    expect(m.size).toBe(0);
  });

  it("keeps custom-hash behavior when hashes are provided", () => {
    const m = new BiMap<{ id: number }, string>({ hashKey: (k) => String(k.id) });
    m.set({ id: 7 }, "seven");
    expect(m.getByKey({ id: 7 })).toBe("seven");
    m.set({ id: 7 }, "SEVEN");
    expect(m.size).toBe(1);
  });

  it("entries() and Symbol.iterator yield pairs", () => {
    const m = new BiMap<string, number>();
    m.set("a", 1);
    m.set("b", 2);
    expect([...m.entries()]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
    expect([...m]).toEqual([...m.entries()]);
  });

  it("set uniqueness invariants hold in native mode", () => {
    const m = new BiMap<string, number>();
    m.set("a", 1);
    m.set("b", 1); // steals value 1 from a
    expect(m.hasKey("a")).toBe(false);
    expect(m.getByValue(1)).toBe("b");
    m.set("b", 2); // rebinds b
    expect(m.hasValue(1)).toBe(false);
    expect(m.size).toBe(1);
  });
});
