import {
  assert,
  coalesce,
  identity,
  isBoolean,
  parseJsonSafe,
  toBoolean,
  toggle,
  toJsonSafe,
} from "../../../src/shared/primitive-helpers";

describe("primitive-helpers", () => {
  describe("toBoolean", () => {
    it("coerces boolean and number", () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(0)).toBe(false);
    });
    it("coerces string with default truthy/falsy", () => {
      expect(toBoolean("true")).toBe(true);
      expect(toBoolean("false")).toBe(false);
      expect(toBoolean("")).toBe(false);
    });
    it("uses default for unknown string", () => {
      expect(toBoolean("maybe", { default: true })).toBe(true);
    });
  });

  describe("isBoolean", () => {
    it("narrows boolean", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean("true")).toBe(false);
    });
  });

  describe("toggle", () => {
    it("flips boolean", () => {
      expect(toggle(true)).toBe(false);
      expect(toggle(false)).toBe(true);
      expect(toggle(undefined, true)).toBe(false);
    });
  });

  describe("coalesce", () => {
    it("returns first defined", () => {
      expect(coalesce(null, undefined, 1, 2)).toBe(1);
      expect(coalesce(null, undefined)).toBeUndefined();
    });
  });

  describe("identity", () => {
    it("returns same reference", () => {
      const x = { a: 1 };
      expect(identity(x)).toBe(x);
    });
  });

  describe("assert", () => {
    it("does not throw when true", () => {
      assert(true);
      assert(1 < 2, "msg");
    });
    it("throws when false", () => {
      expect(() => assert(false)).toThrow("Assertion failed");
      expect(() => assert(false, "custom")).toThrow("custom");
    });
  });

  describe("toJsonSafe", () => {
    it("stringifies value", () => {
      expect(toJsonSafe({ a: 1 })).toBe('{"a":1}');
    });
    it("returns fallback for undefined", () => {
      expect(toJsonSafe(undefined, "x")).toBe("x");
    });
  });

  describe("parseJsonSafe", () => {
    it("parses valid JSON", () => {
      expect(parseJsonSafe('{"a":1}', {})).toEqual({ a: 1 });
    });
    it("returns fallback on invalid JSON", () => {
      expect(parseJsonSafe("invalid", 42)).toBe(42);
    });
  });
});
