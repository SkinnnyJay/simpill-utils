import { adapt, createAdapter } from "../../../src/shared/adapter";

describe("createAdapter", () => {
  it("creates a typed adapter function", () => {
    const adapter = createAdapter((input: { id: string }) => ({ id: Number(input.id) }));
    expect(adapter({ id: "5" })).toEqual({ id: 5 });
  });

  it("adapts values via adapt helper", () => {
    const adapter = createAdapter((input: { name: string }) => input.name.toUpperCase());
    expect(adapt({ name: "simpill" }, adapter)).toBe("SIMPILL");
  });
});
