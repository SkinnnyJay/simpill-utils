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

import { z as zz } from "zod";
import { isoDateTimeWithOffset, jsonString } from "../../../src/shared";

describe("common-schemas (uplift fixes)", () => {
  describe("isoDateOnlyString calendar validation", () => {
    it("rejects impossible calendar dates (previously format-only regex)", () => {
      expect(isoDateOnlyString.safeParse("2024-02-30").success).toBe(false);
      expect(isoDateOnlyString.safeParse("2024-13-45").success).toBe(false);
      expect(isoDateOnlyString.safeParse("2024-04-31").success).toBe(false);
    });
    it("handles leap years", () => {
      expect(isoDateOnlyString.safeParse("2024-02-29").success).toBe(true);
      expect(isoDateOnlyString.safeParse("2023-02-29").success).toBe(false);
      expect(isoDateOnlyString.safeParse("2000-02-29").success).toBe(true);
      expect(isoDateOnlyString.safeParse("1900-02-29").success).toBe(false);
    });
    it("still accepts normal dates and rejects bad formats", () => {
      expect(isoDateOnlyString.safeParse("2026-07-03").success).toBe(true);
      expect(isoDateOnlyString.safeParse("2026-7-3").success).toBe(false);
    });
  });

  describe("isoDateTimeWithOffset", () => {
    it("accepts numeric offsets that plain .datetime() rejects", () => {
      expect(isoDateString.safeParse("2024-01-01T06:15:00+02:00").success).toBe(false);
      expect(isoDateTimeWithOffset.safeParse("2024-01-01T06:15:00+02:00").success).toBe(true);
    });
    it("still accepts Z and rejects garbage", () => {
      expect(isoDateTimeWithOffset.safeParse("2024-01-01T06:15:00Z").success).toBe(true);
      expect(isoDateTimeWithOffset.safeParse("not-a-date").success).toBe(false);
    });
  });

  describe("enumFromList literal preservation", () => {
    it("preserves literal types (compile-time) and runtime membership", () => {
      const e = enumFromList(["red", "green"]);
      // Type-level assertion: z.infer must be the literal union, not string.
      type Inferred = zz.infer<typeof e>;
      const check: Inferred = "red";
      // @ts-expect-error "blue" is not a member of the enum — fails to compile if literals were widened to string
      const bad: Inferred = "blue";
      expect(check).toBe("red");
      expect(bad).toBe("blue");
      expect(e.parse("red")).toBe("red");
      expect(e.safeParse("blue").success).toBe(false);
    });
    it("accepts as-const tuples", () => {
      const list = ["a", "b"] as const;
      const e = enumFromList(list);
      expect(e.options).toEqual(["a", "b"]);
    });
  });

  describe("jsonString", () => {
    const s = jsonString(zz.object({ a: zz.number() }));
    it("parses and validates JSON strings", () => {
      expect(s.parse('{"a":1}')).toEqual({ a: 1 });
    });
    it("reports malformed JSON as a validation issue, not a thrown SyntaxError", () => {
      const r = s.safeParse("{oops");
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0].message).toBe("Invalid JSON");
      }
    });
    it("applies the inner schema to the parsed value", () => {
      expect(s.safeParse('{"a":"nope"}').success).toBe(false);
    });
  });
});
