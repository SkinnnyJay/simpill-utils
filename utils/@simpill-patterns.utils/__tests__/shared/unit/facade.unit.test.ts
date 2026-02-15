import { createFacade, createFacadeFrom } from "../../../src/shared/facade";

describe("createFacade", () => {
  it("returns the facade object", () => {
    const facade = createFacade({
      add: (a: number, b: number) => a + b,
    });

    expect(facade.add(2, 3)).toBe(5);
  });
});

describe("createFacadeFrom", () => {
  it("builds a facade from dependencies", () => {
    const deps = { base: 10 };
    const facade = createFacadeFrom(deps, ({ base }) => ({
      add: (value: number) => base + value,
    }));

    expect(facade.add(5)).toBe(15);
  });
});
