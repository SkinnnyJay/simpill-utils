/**
 * @file get-set (getByPath, setByPath, hasPath) unit tests
 */

import { getByPath, getByPathOrDefault, hasPath, setByPath } from "../../../src/shared/get-set";

describe("get-set", () => {
  describe("getByPath", () => {
    it("returns value at single key", () => {
      expect(getByPath({ a: 1 }, "a")).toBe(1);
    });
    it("returns nested value for dot path", () => {
      expect(getByPath({ a: { b: { c: 2 } } }, "a.b.c")).toBe(2);
    });
    it("returns undefined for missing segment", () => {
      expect(getByPath({ a: {} }, "a.b")).toBe(undefined);
      expect(getByPath({}, "a")).toBe(undefined);
    });
    it("returns obj when path is empty", () => {
      const o = { x: 1 };
      expect(getByPath(o, "")).toBe(o);
    });
  });

  describe("getByPathOrDefault", () => {
    it("returns value when path exists", () => {
      expect(getByPathOrDefault({ a: 1 }, "a", 99)).toBe(1);
    });
    it("returns default when path missing", () => {
      expect(getByPathOrDefault({}, "a", 99)).toBe(99);
    });
  });

  describe("hasPath", () => {
    it("returns true for existing path", () => {
      expect(hasPath({ a: { b: 1 } }, "a.b")).toBe(true);
      expect(hasPath({ a: 1 }, "a")).toBe(true);
    });
    it("returns false for missing path", () => {
      expect(hasPath({ a: {} }, "a.b")).toBe(false);
      expect(hasPath({}, "a")).toBe(false);
    });
    it("returns false when path traverses into primitive without throwing", () => {
      expect(hasPath({ a: 1 }, "a.b")).toBe(false);
      expect(hasPath({ a: "x" }, "a.b")).toBe(false);
      expect(hasPath({ a: true }, "a.b")).toBe(false);
    });
    it("returns true for empty path", () => {
      expect(hasPath({}, "")).toBe(true);
    });
  });

  describe("setByPath", () => {
    it("sets value at path and returns obj", () => {
      const obj = { a: {} };
      const out = setByPath(obj, "a.b", 3);
      expect(out).toBe(obj);
      expect((obj.a as Record<string, unknown>).b).toBe(3);
    });
    it("creates nested objects for missing segments", () => {
      const obj: Record<string, unknown> = {};
      setByPath(obj, "x.y.z", 1);
      expect(obj.x).toEqual({ y: { z: 1 } });
    });
    it("does nothing when path is empty", () => {
      const obj = { a: 1 };
      setByPath(obj, "", 2);
      expect(obj).toEqual({ a: 1 });
    });
  });
});
