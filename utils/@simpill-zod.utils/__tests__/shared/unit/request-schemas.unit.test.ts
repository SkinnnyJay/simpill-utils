import {
  coerceQueryBoolean,
  coerceQueryNumber,
  idParamNumber,
  idParamUuid,
  offsetPaginationSchema,
  paginationSchema,
} from "../../../src/shared";

describe("request-schemas", () => {
  describe("coerceQueryNumber", () => {
    it("coerces string to number", () => {
      expect(coerceQueryNumber.parse("42")).toBe(42);
      expect(coerceQueryNumber.parse(42)).toBe(42);
    });
  });

  describe("coerceQueryBoolean", () => {
    it("parses true-like strings", () => {
      expect(coerceQueryBoolean.parse("true")).toBe(true);
      expect(coerceQueryBoolean.parse("1")).toBe(true);
      expect(coerceQueryBoolean.parse("yes")).toBe(true);
    });
    it("parses false-like strings", () => {
      expect(coerceQueryBoolean.parse("false")).toBe(false);
      expect(coerceQueryBoolean.parse("0")).toBe(false);
      expect(coerceQueryBoolean.parse("")).toBe(false);
    });
  });

  describe("paginationSchema", () => {
    it("returns default page and limit", () => {
      const schema = paginationSchema(100);
      expect(schema.parse({})).toEqual({ page: 1, limit: 10 });
    });
    it("accepts page and limit", () => {
      const schema = paginationSchema(50);
      expect(schema.parse({ page: 2, limit: 20 })).toEqual({ page: 2, limit: 20 });
    });
  });

  describe("offsetPaginationSchema", () => {
    it("returns default offset and limit", () => {
      const schema = offsetPaginationSchema(100);
      expect(schema.parse({})).toEqual({ offset: 0, limit: 10 });
    });
  });

  describe("idParamNumber", () => {
    it("coerces string id to number", () => {
      expect(idParamNumber.parse("123")).toBe(123);
      expect(idParamNumber.parse(123)).toBe(123);
    });
    it("rejects non-positive", () => {
      expect(() => idParamNumber.parse("0")).toThrow();
    });
  });

  describe("idParamUuid", () => {
    it("accepts valid UUID", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(idParamUuid.parse(uuid)).toBe(uuid);
    });
    it("rejects invalid", () => {
      expect(() => idParamUuid.parse("not-a-uuid")).toThrow();
    });
  });
});
