import { createFlyweightFactory } from "../../../src/shared/flyweight";

describe("createFlyweightFactory", () => {
  it("returns cached instances for the same key", () => {
    const factory = createFlyweightFactory(
      (key: { id: string }) => key.id,
      (key) => ({ id: key.id, created: true })
    );

    const first = factory.get({ id: "a" });
    const second = factory.get({ id: "a" });
    const third = factory.get({ id: "b" });

    expect(first).toBe(second);
    expect(first).not.toBe(third);
    expect(factory.size()).toBe(2);
  });

  it("clears cached instances", () => {
    const factory = createFlyweightFactory(
      (id: string) => id,
      (id) => ({ id })
    );
    factory.get("x");
    expect(factory.size()).toBe(1);
    factory.clear();
    expect(factory.size()).toBe(0);
  });
});
