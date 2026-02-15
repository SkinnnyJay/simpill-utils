/**
 * @file create (createWithDefaults, defineReadOnly, fromEntries) unit tests
 */

import { createWithDefaults, defineReadOnly, fromEntries } from "../../../src/shared/create";

describe("create", () => {
  describe("createWithDefaults", () => {
    it("overlays partial on defaults", () => {
      const def = { a: 1, b: 2, c: 3 };
      const out = createWithDefaults(def, { b: 20 });
      expect(out).toEqual({ a: 1, b: 20, c: 3 });
      expect(def).toEqual({ a: 1, b: 2, c: 3 });
    });
    it("returns new object", () => {
      const def = { a: 1 };
      expect(createWithDefaults(def, {})).not.toBe(def);
    });
  });

  describe("defineReadOnly", () => {
    it("defines non-enumerable read-only property", () => {
      const obj: Record<string, number> = {};
      defineReadOnly(obj, "secret", 42);
      expect(obj.secret).toBe(42);
      expect(Object.keys(obj)).not.toContain("secret");
      expect(() => {
        obj.secret = 0;
      }).toThrow();
    });
    it("returns the same object", () => {
      const obj: { k?: number } = {};
      const out = defineReadOnly(obj, "k", 1);
      expect(out).toBe(obj);
      expect(obj.k).toBe(1);
    });
  });

  describe("fromEntries", () => {
    it("builds object from [key, value] pairs", () => {
      const entries: [string, number][] = [
        ["a", 1],
        ["b", 2],
      ];
      expect(fromEntries(entries)).toEqual({ a: 1, b: 2 });
    });
    it("later value wins for duplicate key", () => {
      expect(
        fromEntries([
          ["x", 1],
          ["x", 2],
        ])
      ).toEqual({ x: 2 });
    });
  });
});
