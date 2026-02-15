import { mergeConfigLayers, requireKeys } from "../../../src/shared/config.utils";

describe("config.utils", () => {
  it("mergeConfigLayers", () => {
    const out = mergeConfigLayers([{ a: 1 }, { b: 2 }, { a: 3 }]);
    expect(out).toEqual({ a: 3, b: 2 });
  });

  it("requireKeys throws when missing", () => {
    expect(() => requireKeys({ a: 1 }, ["a", "b"])).toThrow("required key");
  });
});
