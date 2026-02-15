import {
  firstArg,
  lastArg,
  requireArgs,
  restArgs,
  spreadArgs,
} from "../../../src/shared/arguments.utils";

describe("arguments.utils", () => {
  it("spreadArgs", () => {
    expect(spreadArgs([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("firstArg/lastArg", () => {
    expect(firstArg([1, 2, 3])).toBe(1);
    expect(lastArg([1, 2, 3])).toBe(3);
  });

  it("restArgs", () => {
    expect(restArgs([1, 2, 3], 1)).toEqual([2, 3]);
  });

  it("requireArgs throws when missing", () => {
    expect(() => requireArgs([1, null], 2)).toThrow("required");
  });
});
