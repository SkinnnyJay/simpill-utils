import { memoize } from "../../../src/shared";

describe("memoize", () => {
  it("caches by first argument", () => {
    const fn = jest.fn((x: number) => x * 2);
    const m = memoize(fn);
    expect(m(2)).toBe(4);
    expect(m(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses custom key when provided", () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const m = memoize(fn, { key: (...args: unknown[]) => `${args[0]}-${args[1]}` });
    expect(m(1, 2)).toBe(3);
    expect(m(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
