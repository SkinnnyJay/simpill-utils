import { createBuilder } from "../../../src/shared/builder";

describe("createBuilder", () => {
  it("builds objects with set and merge", () => {
    const builder = createBuilder({ name: "Ada", age: 30 });
    const user = builder.set("age", 31).merge({ name: "Grace" }).build();

    expect(user).toEqual({ name: "Grace", age: 31 });
  });

  it("returns a new object each build", () => {
    const builder = createBuilder({ value: 1 });
    const first = builder.build();
    const second = builder.set("value", 2).build();

    expect(first).toEqual({ value: 1 });
    expect(second).toEqual({ value: 2 });
  });
});
