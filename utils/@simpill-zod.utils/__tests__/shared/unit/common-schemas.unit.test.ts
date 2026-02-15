import {
  coerceString,
  enumFromList,
  isoDateOnlyString,
  isoDateString,
  nonEmptyString,
} from "../../../src/shared";

describe("common-schemas", () => {
  describe("nonEmptyString", () => {
    it("accepts non-empty trimmed string", () => {
      expect(nonEmptyString.parse("a")).toBe("a");
      expect(nonEmptyString.parse("  x  ")).toBe("x");
    });
    it("rejects empty or whitespace", () => {
      expect(() => nonEmptyString.parse("")).toThrow();
      expect(() => nonEmptyString.parse("   ")).toThrow();
    });
  });

  describe("isoDateString", () => {
    it("accepts ISO datetime", () => {
      expect(isoDateString.parse("2024-01-15T12:00:00.000Z")).toBe("2024-01-15T12:00:00.000Z");
    });
    it("rejects invalid", () => {
      expect(() => isoDateString.parse("2024-01-15")).toThrow();
    });
  });

  describe("isoDateOnlyString", () => {
    it("accepts YYYY-MM-DD", () => {
      expect(isoDateOnlyString.parse("2024-01-15")).toBe("2024-01-15");
    });
    it("rejects invalid", () => {
      expect(() => isoDateOnlyString.parse("01/15/2024")).toThrow();
    });
  });

  describe("enumFromList", () => {
    it("creates enum from tuple", () => {
      const schema = enumFromList(["a", "b", "c"] as const);
      expect(schema.parse("a")).toBe("a");
      expect(() => schema.parse("d")).toThrow();
    });
  });

  describe("coerceString", () => {
    it("coerces number to string", () => {
      expect(coerceString.parse(42)).toBe("42");
    });
    it("keeps string", () => {
      expect(coerceString.parse("x")).toBe("x");
    });
  });
});
