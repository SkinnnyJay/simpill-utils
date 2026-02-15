describe("once", () => {
  it("invokes fn only once", () => {
    const { once } = require("../../../src/shared");
    const fn = jest.fn((x: number) => x + 1);
    const o = once(fn);
    expect(o(1)).toBe(2);
    expect(o(10)).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
