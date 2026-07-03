import { z } from "zod";
import {
  coerceOptionalString,
  lowerString,
  pipeTransforms,
  trimString,
  upperString,
} from "../../../src/shared";

describe("transforms", () => {
  describe("trimString", () => {
    it("trims string output", () => {
      const schema = trimString(z.string());
      expect(schema.parse("  a  ")).toBe("a");
    });
  });

  describe("lowerString", () => {
    it("lowercases string output", () => {
      const schema = lowerString(z.string());
      expect(schema.parse("ABC")).toBe("abc");
    });
  });

  describe("upperString", () => {
    it("uppercases string output", () => {
      const schema = upperString(z.string());
      expect(schema.parse("abc")).toBe("ABC");
    });
  });

  describe("coerceOptionalString", () => {
    it("returns undefined for null/undefined", () => {
      expect(coerceOptionalString.parse(null)).toBeUndefined();
      expect(coerceOptionalString.parse(undefined)).toBeUndefined();
    });
    it("returns undefined for empty string", () => {
      expect(coerceOptionalString.parse("")).toBeUndefined();
      expect(coerceOptionalString.parse("   ")).toBeUndefined();
    });
    it("returns trimmed string for number or string", () => {
      expect(coerceOptionalString.parse(42)).toBe("42");
      expect(coerceOptionalString.parse("  x  ")).toBe("x");
    });
  });

  describe("pipeTransforms", () => {
    it("pipes two schemas", () => {
      const first = z.string();
      const second = z.string().transform((s) => s.length);
      const piped = pipeTransforms(first, second);
      expect(piped.parse("hello")).toBe(5);
    });
  });
});

import { z as z2 } from "zod";

describe("transforms (uplift fixes: preprocess ordering)", () => {
  it("trimString trims BEFORE validation (previously ' ' passed min(1) and output '')", () => {
    const s = trimString(z2.string().min(1));
    expect(s.safeParse(" ").success).toBe(false);
    expect(s.parse(" a ")).toBe("a");
  });
  it("lowerString lowercases BEFORE validation", () => {
    const s = lowerString(z2.string().regex(/^[a-z]+$/));
    expect(s.parse("ABC")).toBe("abc");
  });
  it("upperString uppercases BEFORE validation", () => {
    const s = upperString(z2.string().regex(/^[A-Z]+$/));
    expect(s.parse("abc")).toBe("ABC");
  });
  it("non-string inputs get the schema's type error, not a TypeError", () => {
    const s = trimString(z2.string());
    const r = s.safeParse(42);
    expect(r.success).toBe(false);
  });
});
