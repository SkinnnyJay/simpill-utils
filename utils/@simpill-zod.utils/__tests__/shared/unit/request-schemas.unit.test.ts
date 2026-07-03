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

import { z } from "zod";
import { coerceQueryArray } from "../../../src/shared";

describe("request-schemas (uplift fixes)", () => {
  describe("coerceQueryNumber empty-string rejection", () => {
    it("rejects empty string (previously coerced to 0)", () => {
      expect(coerceQueryNumber.safeParse("").success).toBe(false);
    });
    it("rejects whitespace-only string (previously coerced to 0)", () => {
      expect(coerceQueryNumber.safeParse("   ").success).toBe(false);
    });
    it("still accepts numeric strings and numbers", () => {
      expect(coerceQueryNumber.parse("3.5")).toBe(3.5);
      expect(coerceQueryNumber.parse(-2)).toBe(-2);
    });
    it("rejects non-numeric strings", () => {
      expect(coerceQueryNumber.safeParse("abc").success).toBe(false);
    });
  });

  describe("coerceQueryBoolean strictness", () => {
    it("rejects unrecognized strings (previously Boolean('banana') === true)", () => {
      expect(coerceQueryBoolean.safeParse("banana").success).toBe(false);
      expect(coerceQueryBoolean.safeParse("maybe").success).toBe(false);
    });
    it("treats off/n as false (previously truthy via Boolean())", () => {
      expect(coerceQueryBoolean.parse("off")).toBe(false);
      expect(coerceQueryBoolean.parse("n")).toBe(false);
    });
    it("treats on/y as true", () => {
      expect(coerceQueryBoolean.parse("on")).toBe(true);
      expect(coerceQueryBoolean.parse("y")).toBe(true);
    });
    it("is case-insensitive and trims", () => {
      expect(coerceQueryBoolean.parse(" TRUE ")).toBe(true);
      expect(coerceQueryBoolean.parse("False")).toBe(false);
    });
    it("passes booleans through", () => {
      expect(coerceQueryBoolean.parse(true)).toBe(true);
      expect(coerceQueryBoolean.parse(false)).toBe(false);
    });
  });

  describe("idParamNumber digit strictness", () => {
    it("rejects hex strings (previously '0x10' -> 16)", () => {
      expect(idParamNumber.safeParse("0x10").success).toBe(false);
    });
    it("rejects exponent notation (previously '1e3' -> 1000)", () => {
      expect(idParamNumber.safeParse("1e3").success).toBe(false);
    });
    it("accepts plain decimal strings and numbers", () => {
      expect(idParamNumber.parse("42")).toBe(42);
      expect(idParamNumber.parse(7)).toBe(7);
    });
    it("rejects zero and negatives", () => {
      expect(idParamNumber.safeParse("0").success).toBe(false);
      expect(idParamNumber.safeParse(-1).success).toBe(false);
    });
  });

  describe("coerceQueryArray", () => {
    const tags = coerceQueryArray(z.string());
    it("wraps a single value", () => {
      expect(tags.parse("a")).toEqual(["a"]);
    });
    it("passes arrays through with item validation", () => {
      expect(tags.parse(["a", "b"])).toEqual(["a", "b"]);
      expect(tags.safeParse([1]).success).toBe(false);
    });
    it("treats undefined as empty array", () => {
      expect(tags.parse(undefined)).toEqual([]);
    });
    it("validates the wrapped single value", () => {
      expect(tags.safeParse(5).success).toBe(false);
    });
  });
});
