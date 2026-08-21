import { adapt, createPatternAdapter } from "../../../src/shared/adapter";

describe("createPatternAdapter", () => {
  it("creates a typed adapter function", () => {
    const adapter = createPatternAdapter((input: { id: string }) => ({ id: Number(input.id) }));
    expect(adapter({ id: "5" })).toEqual({ id: 5 });
  });

  it("adapts values via adapt helper", () => {
    const adapter = createPatternAdapter((input: { name: string }) => input.name.toUpperCase());
    expect(adapt({ name: "simpill" }, adapter)).toBe("SIMPILL");
  });
});
