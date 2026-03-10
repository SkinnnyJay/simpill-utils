import { z } from "zod";
import {
  flattenZodError,
  formatZodError,
  parseOrThrow,
  safeParseResult,
} from "../../../src/shared";

describe("safe-parse", () => {
  const schema = z.object({ name: z.string().min(1), age: z.number().min(0) });

  describe("safeParseResult", () => {
    it("returns success and data when valid", () => {
      const result = safeParseResult(schema, { name: "a", age: 1 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: "a", age: 1 });
      }
    });
    it("returns success false and error when invalid", () => {
      const result = safeParseResult(schema, { name: "", age: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
      }
    });
  });

  describe("flattenZodError", () => {
    it("returns path -> message record", () => {
      const result = safeParseResult(schema, { name: "", age: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const flat = flattenZodError(result.error);
        expect(typeof flat.name).toBe("string");
        expect(typeof flat.age).toBe("string");
      }
    });
  });

  describe("formatZodError", () => {
    it("returns single string with default separator", () => {
      const result = safeParseResult(schema, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = formatZodError(result.error);
        expect(typeof msg).toBe("string");
        expect(msg).toContain("name");
      }
    });
    it("uses custom separator", () => {
      const result = safeParseResult(schema, { name: "", age: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = formatZodError(result.error, " | ");
        expect(msg).toContain(" | ");
      }
    });
  });

  describe("parseOrThrow", () => {
    it("returns data when valid", () => {
      expect(parseOrThrow(schema, { name: "x", age: 0 })).toEqual({ name: "x", age: 0 });
    });
    it("throws when invalid", () => {
      expect(() => parseOrThrow(schema, {})).toThrow();
    });
  });
});
