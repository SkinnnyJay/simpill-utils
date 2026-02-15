import { createFactory } from "../../../src/shared/create-factory";

describe("createFactory", () => {
  it("should return defaults when no overrides", () => {
    const factory = createFactory({ a: 1, b: "x" });
    expect(factory()).toEqual({ a: 1, b: "x" });
  });

  it("should merge overrides shallowly", () => {
    const factory = createFactory({ a: 1, b: "x" });
    expect(factory({ b: "y" })).toEqual({ a: 1, b: "y" });
    expect(factory({ a: 2 })).toEqual({ a: 2, b: "x" });
  });

  it("should not mutate defaults", () => {
    const defaults = { a: 1 };
    const factory = createFactory(defaults);
    factory({ a: 2 });
    expect(defaults.a).toBe(1);
  });
});
