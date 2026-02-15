import { formatString } from "../../../src/shared/format";

describe("formatString", () => {
  it("formats positional placeholders", () => {
    const result = formatString("Hello {0} {1}", ["Ada", "Lovelace"]);
    expect(result).toBe("Hello Ada Lovelace");
  });

  it("formats named placeholders", () => {
    expect(formatString("Hello {name}", { name: "Ada" })).toBe("Hello Ada");
  });

  it("handles escaped braces", () => {
    expect(formatString("Value: {{name}}", { name: "Ada" })).toBe("Value: {name}");
    expect(formatString("}}", [])).toBe("}");
  });

  it("keeps missing placeholders by default", () => {
    expect(formatString("Hello {missing}", { name: "Ada" })).toBe("Hello {missing}");
  });

  it("returns empty for missing placeholders when configured", () => {
    expect(formatString("Hello {missing}", {}, { onMissing: "empty" })).toBe("Hello ");
  });

  it("throws for missing placeholders when configured", () => {
    expect(() => formatString("Hello {missing}", {}, { onMissing: "throw" })).toThrow(
      "Missing value for placeholder",
    );
  });
});
