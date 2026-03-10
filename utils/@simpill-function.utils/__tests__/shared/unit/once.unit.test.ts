import { once } from "../../../src/shared/once";

describe("once", () => {
  it("invokes only once", () => {
    const fn = jest.fn((x: number) => x + 1);
    const o = once(fn);
    expect(o(1)).toBe(2);
    expect(o(10)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
