/**
 * @file Guards unit tests
 */

import {
  hasOwn,
  isDefined,
  isEmptyObject,
  isNil,
  isObject,
  isPlainObject,
  isRecord,
} from "../../../src/shared/guards";

describe("guards", () => {
  describe("isPlainObject", () => {
    it("returns true for {} and { a: 1 }", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
    });
    it("returns false for null, undefined, primitives", () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject(0)).toBe(false);
      expect(isPlainObject("")).toBe(false);
      expect(isPlainObject(true)).toBe(false);
    });
    it("returns false for Array and class instances", () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });
  });

  describe("isObject", () => {
    it("returns true for plain object and array", () => {
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(new Date())).toBe(true);
    });
    it("returns false for null and primitives", () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(1)).toBe(false);
    });
  });

  describe("isRecord", () => {
    it("returns true for plain object", () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ x: 1 })).toBe(true);
    });
    it("returns false for array", () => {
      expect(isRecord([])).toBe(false);
    });
  });

  describe("isEmptyObject", () => {
    it("returns true only for plain object with no keys", () => {
      expect(isEmptyObject({})).toBe(true);
      expect(isEmptyObject({ a: 1 })).toBe(false);
      expect(isEmptyObject(null)).toBe(false);
      expect(isEmptyObject([])).toBe(false);
    });
  });

  describe("isNil", () => {
    it("returns true for null and undefined", () => {
      expect(isNil(null)).toBe(true);
      expect(isNil(undefined)).toBe(true);
    });
    it("returns false for other values", () => {
      expect(isNil(0)).toBe(false);
      expect(isNil("")).toBe(false);
      expect(isNil({})).toBe(false);
    });
  });

  describe("isDefined", () => {
    it("returns false for null and undefined", () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
    it("returns true for other values", () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined("")).toBe(true);
      expect(isDefined({})).toBe(true);
    });
  });

  describe("hasOwn", () => {
    it("returns true for own property", () => {
      expect(hasOwn({ a: 1 }, "a")).toBe(true);
      expect(hasOwn({ 0: "x" }, 0)).toBe(true);
    });
    it("returns false for inherited or missing", () => {
      expect(hasOwn({}, "toString")).toBe(false);
      expect(hasOwn({ a: 1 }, "b")).toBe(false);
    });
  });
});
