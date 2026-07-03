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

import { z as z3 } from "zod";
import { flattenZodErrorAll } from "../../../src/shared";

describe("safe-parse (uplift fixes)", () => {
  const multi = z3.object({
    x: z3
      .string()
      .min(5, "too short")
      .regex(/^[a-z]+$/, "lowercase only"),
  });

  it("flattenZodError keeps the FIRST issue per path (previously last overwrote)", () => {
    const r = multi.safeParse({ x: "A1" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.length).toBe(2);
      expect(flattenZodError(r.error)).toEqual({ x: "too short" });
    }
  });

  it("flattenZodErrorAll keeps every message per path", () => {
    const r = multi.safeParse({ x: "A1" });
    if (!r.success) {
      expect(flattenZodErrorAll(r.error)).toEqual({ x: ["too short", "lowercase only"] });
    }
  });
});
