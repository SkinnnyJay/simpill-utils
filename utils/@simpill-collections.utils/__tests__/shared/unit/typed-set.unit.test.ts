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
