/**
 * @file immutable (deepFreeze, deepSeal) unit tests
 */

import { deepFreeze, deepSeal } from "../../../src/shared/immutable";

describe("immutable", () => {
  describe("deepFreeze", () => {
    it("freezes plain object and nested plain objects", () => {
      const obj = { a: { b: 1 } };
      const out = deepFreeze(obj);
      expect(out).toBe(obj);
      expect(Object.isFrozen(obj)).toBe(true);
      expect(Object.isFrozen((obj as Record<string, unknown>).a)).toBe(true);
    });
    it("returns non-objects unchanged", () => {
      expect(deepFreeze(1)).toBe(1);
      expect(deepFreeze("x")).toBe("x");
    });
    it("prevents mutation after freeze", () => {
      const obj = deepFreeze({ a: 1 });
      expect(() => {
        (obj as Record<string, number>).a = 2;
      }).toThrow();
    });
  });

  describe("deepSeal", () => {
    it("seals plain object and nested plain objects", () => {
      const obj = { a: { b: 1 } };
      const out = deepSeal(obj);
      expect(out).toBe(obj);
      expect(Object.isSealed(obj)).toBe(true);
      expect(Object.isSealed((obj as Record<string, unknown>).a)).toBe(true);
    });
  });
});
