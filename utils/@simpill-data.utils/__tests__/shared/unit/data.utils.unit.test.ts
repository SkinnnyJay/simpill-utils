import { deepClone, deepDefaults, pickKeys } from "../../../src/shared";

describe("data.utils", () => {
  it("deepClone copies nested object", () => {
    const a = { x: { y: 1 } };
    const b = deepClone(a);
    expect(b).toEqual(a);
    expect(b).not.toBe(a);
  });

  it("pickKeys", () => {
    expect(pickKeys({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });
});

describe("deepDefaults", () => {
  it("overlays defaults onto target", () => {
    const target = { a: 1 };
    const defaults = { a: 10, b: 2 };
    expect(deepDefaults(target, defaults)).toEqual({ a: 1, b: 2 });
  });

  it("deep-merges nested plain objects", () => {
    const target = { a: { x: 1 } };
    const defaults = { a: { y: 2 }, b: 3 };
    expect(deepDefaults(target, defaults as unknown as Partial<typeof target>)).toEqual({
      a: { x: 1, y: 2 },
      b: 3,
    });
  });

  it("does not mutate target", () => {
    const target: Record<string, number> = { a: 1 };
    const defaults = { b: 2 };
    const result = deepDefaults(target, defaults);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(target).toEqual({ a: 1 });
  });
});
