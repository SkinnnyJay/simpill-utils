import { Env, EnvManager } from "../../../src/server/env.utils";

describe("Env static methods", () => {
  beforeEach(() => {
    EnvManager.resetInstance();
    process.env.TEST_STRING = "value";
    process.env.TEST_NUMBER = "42";
    process.env.TEST_BOOL = "true";
  });

  afterEach(() => {
    EnvManager.resetInstance();
    delete process.env.TEST_STRING;
    delete process.env.TEST_NUMBER;
    delete process.env.TEST_BOOL;
  });

  describe("getString", () => {
    it("should get string value", () => {
      expect(Env.getString("TEST_STRING", "default")).toBe("value");
    });

    it("should return default when key not found", () => {
      expect(Env.getString("NON_EXISTENT")).toBe("");
      expect(Env.getString("NON_EXISTENT", "custom-default")).toBe("custom-default");
    });
  });

  describe("getNumber", () => {
    it("should get number value", () => {
      expect(Env.getNumber("TEST_NUMBER", 0)).toBe(42);
    });

    it("should return default when key not found", () => {
      expect(Env.getNumber("NON_EXISTENT")).toBe(0);
      expect(Env.getNumber("NON_EXISTENT", 123)).toBe(123);
    });
  });

  describe("getBoolean", () => {
    it("should get boolean value", () => {
      expect(Env.getBoolean("TEST_BOOL", false)).toBe(true);
    });

    it("should return default when key not found", () => {
      expect(Env.getBoolean("NON_EXISTENT")).toBe(false);
      expect(Env.getBoolean("NON_EXISTENT", true)).toBe(true);
    });
  });

  describe("required getters", () => {
    it("should get required string", () => {
      expect(Env.getRequired("TEST_STRING")).toBe("value");
    });

    it("should get required string via getRequiredString alias", () => {
      expect(Env.getRequiredString("TEST_STRING")).toBe("value");
      expect(() => Env.getRequiredString("MISSING_REQ")).toThrow();
    });

    it("should throw for missing required string", () => {
      expect(() => Env.getRequired("NON_EXISTENT")).toThrow();
    });

    it("should get required number", () => {
      expect(Env.getRequiredNumber("TEST_NUMBER")).toBe(42);
    });

    it("should throw for missing required number", () => {
      expect(() => Env.getRequiredNumber("NON_EXISTENT")).toThrow();
    });

    it("should get required boolean", () => {
      expect(Env.getRequiredBoolean("TEST_BOOL")).toBe(true);
    });

    it("should throw for missing required boolean", () => {
      expect(() => Env.getRequiredBoolean("NON_EXISTENT")).toThrow();
    });
  });

  describe("encryption helpers", () => {
    it("should report isEncrypted and getDecrypted", () => {
      expect(Env.isEncrypted("TEST_STRING")).toBe(false);
      expect(Env.getDecrypted("TEST_STRING")).toBe("value");
      expect(Env.hasPrivateKey()).toBe(false);
    });
  });

  describe("utility methods", () => {
    it("should check if key exists", () => {
      expect(Env.has("TEST_STRING")).toBe(true);
      expect(Env.has("NON_EXISTENT")).toBe(false);
    });

    it("should get raw value", () => {
      expect(Env.getValue("TEST_STRING")).toBe("value");
      expect(Env.getValue("NON_EXISTENT")).toBeUndefined();
    });

    it("should get value with default", () => {
      expect(Env.getValueOrDefault("TEST_STRING", "fallback")).toBe("value");
      expect(Env.getValueOrDefault("NON_EXISTENT", "fallback")).toBe("fallback");
    });
  });

  describe("environment checks", () => {
    it("should check production mode", () => {
      process.env.NODE_ENV = "production";
      EnvManager.resetInstance();
      expect(Env.isProduction()).toBe(true);
      expect(Env.isDevelopment()).toBe(false);
    });

    it("should check development mode", () => {
      process.env.NODE_ENV = "development";
      EnvManager.resetInstance();
      expect(Env.isDevelopment()).toBe(true);
      expect(Env.isProduction()).toBe(false);
    });

    it("should check test mode", () => {
      process.env.NODE_ENV = "test";
      EnvManager.resetInstance();
      expect(Env.isTest()).toBe(true);
    });

    it("should get NODE_ENV", () => {
      process.env.NODE_ENV = "staging";
      EnvManager.resetInstance();
      expect(Env.getNodeEnv()).toBe("staging");
    });
  });

  describe("cache management", () => {
    it("should check dynamic mode", () => {
      expect(Env.isDynamic()).toBe(false);
    });

    it("should get cache size", () => {
      Env.getString("TEST_STRING");
      expect(Env.getCacheSize()).toBeGreaterThan(0);
    });

    it("should refresh cache", () => {
      expect(() => Env.refresh()).not.toThrow();
    });
  });

  describe("bootstrap", () => {
    it("should bootstrap without error", () => {
      expect(() => Env.bootstrap()).not.toThrow();
    });

    it("should reset instance", () => {
      expect(() => Env.reset()).not.toThrow();
    });
  });

  describe("array methods", () => {
    beforeEach(() => {
      process.env.TEST_ARRAY = "a,b,c";
      process.env.TEST_ARRAY_COLON = "x:y:z";
      EnvManager.resetInstance();
    });

    afterEach(() => {
      delete process.env.TEST_ARRAY;
      delete process.env.TEST_ARRAY_COLON;
    });

    it("should get array with default separator", () => {
      expect(Env.getArray("TEST_ARRAY")).toEqual(["a", "b", "c"]);
    });

    it("should get array with custom separator", () => {
      expect(Env.getArray("TEST_ARRAY_COLON", [], ":")).toEqual(["x", "y", "z"]);
    });

    it("should return default for missing key", () => {
      expect(Env.getArray("MISSING")).toEqual([]);
      expect(Env.getArray("MISSING", ["default"])).toEqual(["default"]);
    });
  });

  describe("json methods", () => {
    beforeEach(() => {
      process.env.TEST_JSON = '{"key":"value"}';
      EnvManager.resetInstance();
    });

    afterEach(() => {
      delete process.env.TEST_JSON;
    });

    it("should get json value", () => {
      expect(Env.getJson("TEST_JSON")).toEqual({ key: "value" });
    });

    it("should return default for missing key", () => {
      expect(Env.getJson("MISSING", { default: true })).toEqual({ default: true });
    });

    it("should get required json", () => {
      expect(Env.getRequiredJson("TEST_JSON")).toEqual({ key: "value" });
    });

    it("should throw for missing required json", () => {
      expect(() => Env.getRequiredJson("MISSING")).toThrow();
    });
  });

  describe("deprecated methods", () => {
    it("should still work for backward compatibility", () => {
      expect(Env.getStringStrict("TEST_STRING")).toBe("value");
      expect(Env.getNumberStrict("TEST_NUMBER")).toBe(42);
      expect(Env.getBooleanStrict("TEST_BOOL")).toBe(true);
    });
  });

  describe("validated methods", () => {
    beforeEach(() => {
      process.env.TEST_URL = "https://example.com";
      process.env.TEST_PORT = "8080";
      EnvManager.resetInstance();
    });

    afterEach(() => {
      delete process.env.TEST_URL;
      delete process.env.TEST_PORT;
    });

    it("should validate string", () => {
      expect(Env.getValidatedString("TEST_URL", (v) => v.startsWith("https://"))).toBe(
        "https://example.com"
      );
    });

    it("should throw for invalid string", () => {
      expect(() =>
        Env.getValidatedString("TEST_URL", (v) => v.startsWith("http://") || "Wrong protocol")
      ).toThrow("Wrong protocol");
    });

    it("should validate number", () => {
      expect(Env.getValidatedNumber("TEST_PORT", (v) => v > 0 && v < 65536)).toBe(8080);
    });

    it("should throw for invalid number", () => {
      process.env.TEST_PORT = "99999";
      EnvManager.resetInstance();
      expect(() =>
        Env.getValidatedNumber("TEST_PORT", (v) => v < 65536 || "Port too high")
      ).toThrow("Port too high");
    });
  });
});
