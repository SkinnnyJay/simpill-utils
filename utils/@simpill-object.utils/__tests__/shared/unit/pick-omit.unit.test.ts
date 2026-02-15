/**
 * @file pick/omit unit tests
 */

import { omit, pick, pickOne } from "../../../src/shared/pick-omit";

describe("pick-omit", () => {
  describe("pick", () => {
    it("returns object with only specified keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });
    it("omits keys not present on obj", () => {
      const obj = { a: 1 };
      expect(pick(obj, ["a", "b" as keyof typeof obj])).toEqual({ a: 1 });
    });
    it("returns empty object when keys empty", () => {
      expect(pick({ a: 1 }, [])).toEqual({});
    });
  });

  describe("omit", () => {
    it("returns object without specified keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
    });
    it("returns empty when all keys omitted", () => {
      expect(omit({ a: 1 }, ["a"])).toEqual({});
    });
  });

  describe("pickOne", () => {
    it("returns object with single key", () => {
      expect(pickOne({ a: 1, b: 2 }, "a")).toEqual({ a: 1 });
    });
  });
});
