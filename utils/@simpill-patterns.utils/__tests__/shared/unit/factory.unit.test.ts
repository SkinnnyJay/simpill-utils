import { createFactory } from "../../../src/shared/factory";

describe("createFactory", () => {
  it("creates a typed factory function", () => {
    const userFactory = createFactory((name: string) => ({ name, active: true }));
    expect(userFactory("Ada")).toEqual({ name: "Ada", active: true });
  });
});
