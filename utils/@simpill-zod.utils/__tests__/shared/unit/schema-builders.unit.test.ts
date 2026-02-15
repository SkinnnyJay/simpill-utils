import { z } from "zod";
import {
  booleanField,
  nullableWithDefault,
  numberField,
  optionalWithDefault,
  stringField,
} from "../../../src/shared";

describe("schema-builders", () => {
  describe("optionalWithDefault", () => {
    it("returns default when input is undefined", () => {
      const schema = optionalWithDefault(z.number(), 0);
      expect(schema.parse(undefined)).toBe(0);
      expect(schema.parse(5)).toBe(5);
    });
  });

  describe("nullableWithDefault", () => {
    it("returns default when input is null", () => {
      const schema = nullableWithDefault(z.string(), "default");
      expect(schema.parse(null)).toBe("default");
      expect(schema.parse("x")).toBe("x");
    });
  });

  describe("stringField", () => {
    it("returns schema when no default", () => {
      const schema = stringField(z.string());
      expect(schema.parse("a")).toBe("a");
    });
    it("returns default when provided", () => {
      const schema = stringField(z.string(), "default");
      expect(schema.parse(undefined)).toBe("default");
    });
  });

  describe("numberField", () => {
    it("returns schema when no default", () => {
      const schema = numberField(z.number());
      expect(schema.parse(42)).toBe(42);
    });
    it("returns default when provided", () => {
      const schema = numberField(z.number(), 0);
      expect(schema.parse(undefined)).toBe(0);
    });
  });

  describe("booleanField", () => {
    it("returns schema when no default", () => {
      const schema = booleanField(z.boolean());
      expect(schema.parse(true)).toBe(true);
    });
    it("returns default when provided", () => {
      const schema = booleanField(z.boolean(), false);
      expect(schema.parse(undefined)).toBe(false);
    });
  });
});
