import { memoize } from "../../../src/shared/memoize";

describe("memoize", () => {
  it("caches by first argument", () => {
    const fn = jest.fn((x: number) => x * 2);
    const m = memoize(fn);
    expect(m(2)).toBe(4);
    expect(m(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
