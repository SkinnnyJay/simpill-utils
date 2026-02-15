import { type Decorator, decorate } from "../../../src/shared/decorator";

describe("decorate", () => {
  it("composes decorators in order", () => {
    const base = (value: number) => value;
    const addTwo: Decorator<[number], number> = (fn) => (value) => fn(value) + 2;
    const timesThree: Decorator<[number], number> = (fn) => (value) => fn(value) * 3;

    const wrapped = decorate(base, addTwo, timesThree);
    expect(wrapped(1)).toBe(9); // (1 + 2) * 3
  });

  it("returns the original function when no decorators provided", () => {
    const add = (a: number, b: number) => a + b;
    const wrapped = decorate(add);
    expect(wrapped(2, 3)).toBe(5);
  });
});
