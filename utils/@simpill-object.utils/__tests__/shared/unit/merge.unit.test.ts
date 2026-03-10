/**
 * @file merge unit tests
 */

import { deepMerge, shallowMerge } from "../../../src/shared/merge";

describe("merge", () => {
  describe("shallowMerge", () => {
    it("returns new object with source overriding target", () => {
      const a = { x: 1, y: 2 };
      const b = { y: 3, z: 4 };
      const out = shallowMerge(a, b);
      expect(out).toEqual({ x: 1, y: 3, z: 4 });
      expect(a).toEqual({ x: 1, y: 2 });
    });
  });

  describe("deepMerge", () => {
    it("merges nested plain objects", () => {
      const a = { a: { b: 1, c: 2 } };
      const b = { a: { c: 3, d: 4 } };
      expect(deepMerge(a, b)).toEqual({ a: { b: 1, c: 3, d: 4 } });
    });
    it("does not mutate target", () => {
      const a = { a: { b: 1 } };
      const b = { a: { c: 2 } };
      deepMerge(a, b);
      expect(a).toEqual({ a: { b: 1 } });
    });
    it("concatArrays concatenates arrays", () => {
      const a = { arr: [1, 2] };
      const b = { arr: [3, 4] };
      expect(deepMerge(a, b, { concatArrays: true })).toEqual({
        arr: [1, 2, 3, 4],
      });
    });
    it("skipUndefined does not overwrite with undefined", () => {
      const a = { x: 1, y: 2 };
      const b = { y: undefined as number | undefined, z: 3 };
      expect(deepMerge(a, b, { skipUndefined: true })).toEqual({
        x: 1,
        y: 2,
        z: 3,
      });
    });
  });
});
