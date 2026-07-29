import { createPatternFactory } from "../../../src/shared/factory";

describe("createPatternFactory", () => {
  it("creates a typed factory function", () => {
    const userFactory = createPatternFactory((name: string) => ({ name, active: true }));
    expect(userFactory("Ada")).toEqual({ name: "Ada", active: true });
  });
});
