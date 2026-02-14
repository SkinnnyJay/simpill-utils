/**
 * @file Singleton unit tests
 */

import { createSingleton, resetAllSingletons, resetSingleton } from "../../../src/shared/singleton";

describe("singleton", () => {
  afterEach(() => {
    resetAllSingletons();
  });

  describe("createSingleton", () => {
    it("returns same instance on multiple calls", () => {
      const getInstance = createSingleton(() => ({ id: 1 }), "test");
      const a = getInstance();
      const b = getInstance();
      expect(a).toBe(b);
      expect(a).toEqual({ id: 1 });
    });

    it("different keys return different instances", () => {
      const getA = createSingleton(() => ({}), "keyA");
      const getB = createSingleton(() => ({}), "keyB");
      expect(getA()).not.toBe(getB());
    });

    it("calls factory only once per key", () => {
      let calls = 0;
      const getInstance = createSingleton(() => {
        calls++;
        return { n: calls };
      }, "once");
      getInstance();
      getInstance();
      getInstance();
      expect(calls).toBe(1);
      expect(getInstance().n).toBe(1);
    });
  });

  describe("resetSingleton", () => {
    it("clears one key so factory is called again", () => {
      let calls = 0;
      const getInstance = createSingleton(() => {
        calls++;
        return {};
      }, "resetMe");
      getInstance();
      resetSingleton("resetMe");
      getInstance();
      expect(calls).toBe(2);
    });
  });

  describe("resetAllSingletons", () => {
    it("clears all keys", () => {
      const getA = createSingleton(() => ({}), "a");
      const getB = createSingleton(() => ({}), "b");
      const firstA = getA();
      const firstB = getB();
      resetAllSingletons();
      expect(getA()).not.toBe(firstA);
      expect(getB()).not.toBe(firstB);
    });
  });
});
