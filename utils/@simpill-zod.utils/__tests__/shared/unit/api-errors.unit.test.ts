import { z } from "zod";
import { parseOrThrowValidation, safeParseResult, toValidationError } from "../../../src/shared";

describe("api-errors", () => {
  const schema = z.object({ name: z.string().min(1) });

  describe("toValidationError", () => {
    it("returns payload with code and details from error", () => {
      const result = safeParseResult(schema, { name: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        const payload = toValidationError(result);
        expect(payload.code).toBe("VALIDATION_ERROR");
        expect(payload.message).toBe("Validation failed");
        expect(typeof payload.details.name).toBe("string");
      }
    });
  });

  describe("parseOrThrowValidation", () => {
    it("returns data when valid", () => {
      expect(parseOrThrowValidation(schema, { name: "x" })).toEqual({ name: "x" });
    });
    it("throws with payload when invalid", () => {
      try {
        parseOrThrowValidation(schema, {});
      } catch (err: unknown) {
        const e = err as Error & { payload: { code: string; details: Record<string, string> } };
        expect(e.payload.code).toBe("VALIDATION_ERROR");
        expect(e.payload.details).toBeDefined();
      }
    });
  });
});

import { z as z4 } from "zod";
import { ValidationError } from "../../../src/shared";

describe("api-errors (uplift fixes)", () => {
  it("parseOrThrowValidation throws an instanceof-checkable ValidationError", () => {
    try {
      parseOrThrowValidation(z4.object({ a: z4.number() }), { a: "x" });
      fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err).toBeInstanceOf(Error);
      const ve = err as ValidationError;
      expect(ve.name).toBe("ValidationError");
      expect(ve.message).toBe("Validation failed");
      expect(ve.payload.code).toBe("VALIDATION_ERROR");
      expect(ve.payload.details.a).toBeDefined();
    }
  });
});
