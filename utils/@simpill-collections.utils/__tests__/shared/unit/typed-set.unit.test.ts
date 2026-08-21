/**
 * @file TypedSet unit tests
 */

import { TypedSet } from "../../../src/shared/collections/typed-set";

describe("TypedSet", () => {
  it("add and has", () => {
    const s = new TypedSet<number>();
    s.add(1);
    s.add(2);
    expect(s.has(1)).toBe(true);
    expect(s.size).toBe(2);
  });

  it("no duplicate with default equals", () => {
    const s = new TypedSet<number>();
    s.add(1);
    s.add(1);
    expect(s.size).toBe(1);
  });

  it("custom equals", () => {
    const s = new TypedSet<{ id: number }>({
      equals: (a, b) => a.id === b.id,
    });
    s.add({ id: 1 });
    s.add({ id: 1 });
    expect(s.size).toBe(1);
  });

  it("validate rejects invalid", () => {
    const s = new TypedSet<number>({
      validate: (x) => x > 0,
    });
    s.add(1);
    s.add(-1);
    expect(s.size).toBe(1);
    expect(s.has(-1)).toBe(false);
  });

  it("delete and clear", () => {
    const s = new TypedSet<number>();
    s.add(1);
    expect(s.delete(1)).toBe(true);
    expect(s.has(1)).toBe(false);
    s.add(2);
    s.clear();
    expect(s.size).toBe(0);
  });

  it("forEach", () => {
    const s = new TypedSet<number>();
    s.add(1);
    s.add(2);
    const seen: number[] = [];
    s.forEach((v) => {
      seen.push(v);
    });
    expect(seen.sort()).toEqual([1, 2]);
  });

  it("toArray and isEmpty", () => {
    const s = new TypedSet<number>();
    expect(s.isEmpty()).toBe(true);
    s.add(1);
    expect(s.toArray()).toEqual([1]);
  });
});

describe("TypedSet (uplift)", () => {
  it("default path dedupes and deletes via native Set semantics", () => {
    const s = TypedSet.from([1, 2, 2, 3, NaN, NaN]);
    expect(s.size).toBe(4); // SameValueZero: NaN dedupes (Array === never matched NaN)
    expect(s.has(NaN)).toBe(true);
    expect(s.delete(2)).toBe(true);
    expect(s.delete(2)).toBe(false);
    expect(s.toArray()).toEqual([1, 3, NaN]);
  });

  it("provides Set-parity iterators", () => {
    const s = TypedSet.from(["a", "b"]);
    expect([...s.keys()]).toEqual(["a", "b"]);
    expect([...s.values()]).toEqual(["a", "b"]);
    expect([...s.entries()]).toEqual([
      ["a", "a"],
      ["b", "b"],
    ]);
  });

  it("from() honors options (custom equals + validate)", () => {
    const s = TypedSet.from([{ id: 1 }, { id: 1 }, { id: 2 }, { id: -1 }], {
      equals: (a, b) => a.id === b.id,
      validate: (v) => v.id > 0,
    });
    expect(s.size).toBe(2);
    expect(s.has({ id: 2 })).toBe(true);
    expect(s.has({ id: -1 })).toBe(false);
  });
});
