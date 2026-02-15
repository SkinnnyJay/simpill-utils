import * as fs from "node:fs";
import * as path from "node:path";
import { EnvManager } from "../../../src/server/env.utils";

describe("EnvManager", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = EnvManager.getInstance();
      const instance2 = EnvManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should snapshot process.env on creation", () => {
      process.env.TEST_VAR = "test-value";
      const manager = EnvManager.getInstance();
      expect(manager.has("TEST_VAR")).toBe(true);
      expect(manager.getString("TEST_VAR")).toBe("test-value");
    });

    it("should use envPath option when provided", () => {
      const testEnvPath = path.join(__dirname, ".test-envpath.env");
      fs.writeFileSync(testEnvPath, "ENVPATH_VAR=envpath-value\n");
      try {
        const manager = EnvManager.getInstance({ envPath: testEnvPath });
        expect(manager.getString("ENVPATH_VAR")).toBe("envpath-value");
      } finally {
        fs.unlinkSync(testEnvPath);
      }
    });

    it("should use envPaths option when provided", () => {
      const testEnvPath1 = path.join(__dirname, ".test-envpaths1.env");
      const testEnvPath2 = path.join(__dirname, ".test-envpaths2.env");
      fs.writeFileSync(testEnvPath1, "ENVPATHS_VAR1=value1\n");
      fs.writeFileSync(testEnvPath2, "ENVPATHS_VAR2=value2\n");
      try {
        const manager = EnvManager.getInstance({ envPaths: [testEnvPath1, testEnvPath2] });
        expect(manager.getString("ENVPATHS_VAR1")).toBe("value1");
        expect(manager.getString("ENVPATHS_VAR2")).toBe("value2");
      } finally {
        fs.unlinkSync(testEnvPath1);
        fs.unlinkSync(testEnvPath2);
      }
    });

    it("should use default paths when no options provided", () => {
      const manager = EnvManager.getInstance();
      expect(manager).toBeDefined();
    });

    it("should handle non-existent env files gracefully", () => {
      const manager = EnvManager.getInstance({ envPath: "/non/existent/path/.env" });
      expect(manager).toBeDefined();
    });

    it("should skip files that fail to parse in envPaths", () => {
      const existingPath = path.join(__dirname, ".test-skip-parse.env");
      fs.writeFileSync(existingPath, "SKIP_PARSE_VAR=value\n");
      try {
        const manager = EnvManager.getInstance({
          envPaths: [
            "/absolutely/non/existent/path1/.env",
            existingPath,
            "/absolutely/non/existent/path2/.env",
          ],
        });
        expect(manager.getString("SKIP_PARSE_VAR")).toBe("value");
      } finally {
        fs.unlinkSync(existingPath);
      }
    });
  });

  describe("getString", () => {
    it("should return environment variable value", () => {
      process.env.TEST_STRING = "test-value";
      const manager = EnvManager.getInstance();
      expect(manager.getString("TEST_STRING", "default")).toBe("test-value");
    });

    it("should return default when variable not set", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getString("NON_EXISTENT", "default")).toBe("default");
    });

    it("should return empty string as default", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getString("NON_EXISTENT")).toBe("");
    });
  });

  describe("getNumber", () => {
    it("should parse valid number", () => {
      process.env.TEST_NUMBER = "42";
      const manager = EnvManager.getInstance();
      expect(manager.getNumber("TEST_NUMBER", 0)).toBe(42);
    });

    it("should return default for invalid number", () => {
      process.env.TEST_NUMBER = "not-a-number";
      const manager = EnvManager.getInstance();
      expect(manager.getNumber("TEST_NUMBER", 100)).toBe(100);
    });

    it("should return default when key not in cache", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getNumber("NON_EXISTENT_NUMBER", 999)).toBe(999);
    });

    it("should return 0 as default when no default provided", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getNumber("NON_EXISTENT_NUMBER")).toBe(0);
    });
  });

  describe("getNumberStrict", () => {
    it("should parse valid number", () => {
      process.env.TEST_NUMBER_STRICT = "42";
      const manager = EnvManager.getInstance();
      expect(manager.getNumberStrict("TEST_NUMBER_STRICT")).toBe(42);
    });

    it("should throw MissingEnvError when key not in cache", () => {
      const manager = EnvManager.getInstance();
      expect(() => manager.getNumberStrict("NON_EXISTENT_NUMBER")).toThrow();
    });
  });

  describe("getBoolean", () => {
    it("should parse 'true' as true", () => {
      process.env.TEST_BOOL = "true";
      const manager = EnvManager.getInstance();
      expect(manager.getBoolean("TEST_BOOL", false)).toBe(true);
    });

    it("should parse 'false' as false", () => {
      process.env.TEST_BOOL = "false";
      const manager = EnvManager.getInstance();
      expect(manager.getBoolean("TEST_BOOL", true)).toBe(false);
    });

    it("should return default when key not in cache", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getBoolean("NON_EXISTENT_BOOL", true)).toBe(true);
    });

    it("should return false as default when no default provided", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getBoolean("NON_EXISTENT_BOOL")).toBe(false);
    });
  });

  describe("getBooleanStrict", () => {
    it("should parse 'true' as true", () => {
      process.env.TEST_BOOL_STRICT = "true";
      const manager = EnvManager.getInstance();
      expect(manager.getBooleanStrict("TEST_BOOL_STRICT")).toBe(true);
    });

    it("should throw MissingEnvError when key not in cache", () => {
      const manager = EnvManager.getInstance();
      expect(() => manager.getBooleanStrict("NON_EXISTENT_BOOL")).toThrow();
    });
  });

  describe("getValue", () => {
    it("should return value when key exists", () => {
      process.env.TEST_VALUE = "test-value";
      const manager = EnvManager.getInstance();
      expect(manager.getValue("TEST_VALUE")).toBe("test-value");
    });

    it("should return undefined when key does not exist", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getValue("NON_EXISTENT_VALUE")).toBeUndefined();
    });
  });

  describe("getValueOrDefault", () => {
    it("should return value when key exists", () => {
      process.env.TEST_VALUE = "test-value";
      const manager = EnvManager.getInstance();
      expect(manager.getValueOrDefault("TEST_VALUE", "default")).toBe("test-value");
    });

    it("should return default when key does not exist", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getValueOrDefault("NON_EXISTENT_VALUE", "default")).toBe("default");
    });
  });

  describe("getEnvironment", () => {
    it("should return NODE_ENV value when set", () => {
      process.env.NODE_ENV = "staging";
      const manager = EnvManager.getInstance();
      expect(manager.getEnvironment()).toBe("staging");
    });

    it("should return 'development' when NODE_ENV is undefined", () => {
      delete process.env.NODE_ENV;
      const manager = EnvManager.getInstance();
      expect(manager.getEnvironment()).toBe("development");
    });
  });

  describe("has", () => {
    it("should return true for existing variable", () => {
      process.env.TEST = "value";
      const manager = EnvManager.getInstance();
      expect(manager.has("TEST")).toBe(true);
    });

    it("should return false for non-existent variable", () => {
      const manager = EnvManager.getInstance();
      expect(manager.has("NON_EXISTENT")).toBe(false);
    });
  });

  describe("isProduction", () => {
    it("should return true when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      const manager = EnvManager.getInstance();
      expect(manager.isProduction()).toBe(true);
    });

    it("should return false when NODE_ENV is not production", () => {
      process.env.NODE_ENV = "development";
      const manager = EnvManager.getInstance();
      expect(manager.isProduction()).toBe(false);
    });
  });

  describe("isDevelopment", () => {
    it("should return true when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      const manager = EnvManager.getInstance();
      expect(manager.isDevelopment()).toBe(true);
    });

    it("should return false when NODE_ENV is not development", () => {
      process.env.NODE_ENV = "production";
      const manager = EnvManager.getInstance();
      expect(manager.isDevelopment()).toBe(false);
    });

    it("should return true when NODE_ENV is undefined (defaults to development)", () => {
      delete process.env.NODE_ENV;
      const manager = EnvManager.getInstance();
      expect(manager.isDevelopment()).toBe(true);
    });
  });

  describe("dynamic mode", () => {
    it("should use cache by default (dynamic: false)", () => {
      process.env.DYNAMIC_TEST = "initial";
      const manager = EnvManager.getInstance();
      expect(manager.isDynamic()).toBe(false);

      // Change process.env after initialization
      process.env.DYNAMIC_TEST = "changed";

      // Should still return cached value
      expect(manager.getString("DYNAMIC_TEST")).toBe("initial");
    });

    it("should read from process.env when dynamic: true", () => {
      process.env.DYNAMIC_TEST = "initial";
      EnvManager.resetInstance();
      const manager = EnvManager.getInstance({ dynamic: true });
      expect(manager.isDynamic()).toBe(true);

      // Change process.env after initialization
      process.env.DYNAMIC_TEST = "changed";

      // Should return current process.env value
      expect(manager.getString("DYNAMIC_TEST")).toBe("changed");
    });

    it("should reflect runtime changes in has() when dynamic", () => {
      EnvManager.resetInstance();
      const manager = EnvManager.getInstance({ dynamic: true });

      expect(manager.has("NEW_RUNTIME_VAR")).toBe(false);

      process.env.NEW_RUNTIME_VAR = "new-value";
      expect(manager.has("NEW_RUNTIME_VAR")).toBe(true);

      delete process.env.NEW_RUNTIME_VAR;
      expect(manager.has("NEW_RUNTIME_VAR")).toBe(false);
    });

    it("should reflect runtime changes in getNumber() when dynamic", () => {
      process.env.DYNAMIC_NUMBER = "42";
      EnvManager.resetInstance();
      const manager = EnvManager.getInstance({ dynamic: true });

      expect(manager.getNumber("DYNAMIC_NUMBER", 0)).toBe(42);

      process.env.DYNAMIC_NUMBER = "100";
      expect(manager.getNumber("DYNAMIC_NUMBER", 0)).toBe(100);
    });

    it("should reflect runtime changes in getBoolean() when dynamic", () => {
      process.env.DYNAMIC_BOOL = "true";
      EnvManager.resetInstance();
      const manager = EnvManager.getInstance({ dynamic: true });

      expect(manager.getBoolean("DYNAMIC_BOOL", false)).toBe(true);

      process.env.DYNAMIC_BOOL = "false";
      expect(manager.getBoolean("DYNAMIC_BOOL", true)).toBe(false);
    });

    it("should reflect runtime changes in getEnvironment() when dynamic", () => {
      process.env.NODE_ENV = "development";
      EnvManager.resetInstance();
      const manager = EnvManager.getInstance({ dynamic: true });

      expect(manager.getEnvironment()).toBe("development");

      process.env.NODE_ENV = "production";
      expect(manager.getEnvironment()).toBe("production");
      expect(manager.isProduction()).toBe(true);
      expect(manager.isDevelopment()).toBe(false);
    });
  });

  describe("refresh", () => {
    it("should update cache from process.env", () => {
      process.env.REFRESH_TEST = "initial";
      const manager = EnvManager.getInstance();

      expect(manager.getString("REFRESH_TEST")).toBe("initial");

      // Change process.env
      process.env.REFRESH_TEST = "updated";

      // Still cached
      expect(manager.getString("REFRESH_TEST")).toBe("initial");

      // Refresh cache
      manager.refresh();

      // Now updated
      expect(manager.getString("REFRESH_TEST")).toBe("updated");
    });

    it("should pick up new variables after refresh", () => {
      const manager = EnvManager.getInstance();

      expect(manager.has("NEW_VAR_AFTER_INIT")).toBe(false);

      process.env.NEW_VAR_AFTER_INIT = "new-value";
      manager.refresh();

      expect(manager.has("NEW_VAR_AFTER_INIT")).toBe(true);
      expect(manager.getString("NEW_VAR_AFTER_INIT")).toBe("new-value");
    });

    it("should remove deleted variables after refresh", () => {
      process.env.TO_BE_DELETED = "exists";
      const manager = EnvManager.getInstance();

      expect(manager.has("TO_BE_DELETED")).toBe(true);

      delete process.env.TO_BE_DELETED;
      manager.refresh();

      expect(manager.has("TO_BE_DELETED")).toBe(false);
    });

    it("should reapply overrides after refresh", () => {
      process.env.OVERRIDE_TEST = "original";
      EnvManager.resetInstance();
      const manager = EnvManager.getInstance({
        overrides: { OVERRIDE_TEST: "overridden" },
      });

      expect(manager.getString("OVERRIDE_TEST")).toBe("overridden");

      process.env.OVERRIDE_TEST = "changed";
      manager.refresh();

      // Override should still take precedence
      expect(manager.getString("OVERRIDE_TEST")).toBe("overridden");
    });
  });

  describe("getCacheSize", () => {
    it("should return number of cached entries", () => {
      process.env.CACHE_VAR_1 = "value1";
      process.env.CACHE_VAR_2 = "value2";
      const manager = EnvManager.getInstance();

      const size = manager.getCacheSize();
      expect(size).toBeGreaterThanOrEqual(2);
    });

    it("should update after refresh", () => {
      const manager = EnvManager.getInstance();
      const initialSize = manager.getCacheSize();

      process.env.NEW_CACHE_VAR = "new";
      manager.refresh();

      expect(manager.getCacheSize()).toBe(initialSize + 1);

      delete process.env.NEW_CACHE_VAR;
    });
  });

  describe("bootstrap", () => {
    it("should mark as bootstrapped", () => {
      expect(EnvManager.isBootstrapped()).toBe(false);
      EnvManager.bootstrap();
      expect(EnvManager.isBootstrapped()).toBe(true);
    });

    it("should not bootstrap twice", () => {
      EnvManager.bootstrap();
      const firstBootstrapped = EnvManager.isBootstrapped();
      EnvManager.bootstrap();
      expect(EnvManager.isBootstrapped()).toBe(firstBootstrapped);
    });

    it("should accept custom paths parameter", () => {
      const testEnvPath = path.join(__dirname, ".test-bootstrap.env");
      fs.writeFileSync(testEnvPath, "BOOTSTRAP_VAR=bootstrap-value\n");
      try {
        EnvManager.bootstrap([testEnvPath]);
        expect(EnvManager.isBootstrapped()).toBe(true);
        expect(process.env.BOOTSTRAP_VAR).toBe("bootstrap-value");
      } finally {
        fs.unlinkSync(testEnvPath);
        delete process.env.BOOTSTRAP_VAR;
      }
    });

    it("should write to stderr when files are loaded", () => {
      const testEnvPath = path.join(__dirname, ".test-bootstrap-stderr.env");
      fs.writeFileSync(testEnvPath, "STDERR_VAR=stderr-value\n");
      const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
      try {
        EnvManager.bootstrap([testEnvPath]);
        expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("[EnvManager] Loaded:"));
      } finally {
        stderrSpy.mockRestore();
        fs.unlinkSync(testEnvPath);
        delete process.env.STDERR_VAR;
      }
    });

    it("should skip non-existent files in bootstrap without logging", () => {
      expect(() => {
        EnvManager.bootstrap(["/absolutely/non/existent/path/that/does/not/exist.env"]);
      }).not.toThrow();
      expect(EnvManager.isBootstrapped()).toBe(true);
    });

    it("should handle mix of existing and non-existing files in bootstrap", () => {
      const testEnvPath = path.join(__dirname, ".test-bootstrap-mix.env");
      fs.writeFileSync(testEnvPath, "BOOTSTRAP_MIX_VAR=mix-value\n");
      const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
      try {
        EnvManager.bootstrap(["/non/existent/first.env", testEnvPath, "/non/existent/second.env"]);
        expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining(testEnvPath));
      } finally {
        stderrSpy.mockRestore();
        fs.unlinkSync(testEnvPath);
        delete process.env.BOOTSTRAP_MIX_VAR;
      }
    });

    it("should apply overrides in bootstrap", () => {
      EnvManager.bootstrap({
        envPaths: [],
        overrides: { BOOTSTRAP_OVERRIDE: "override-value" },
      });
      expect(process.env.BOOTSTRAP_OVERRIDE).toBe("override-value");
      delete process.env.BOOTSTRAP_OVERRIDE;
    });

    it("should extend process.env by default", () => {
      EnvManager.bootstrap({ envPaths: [] });
      expect(typeof process.env.getString).toBe("function");
      expect(typeof process.env.getNumber).toBe("function");
      expect(typeof process.env.getBoolean).toBe("function");
      expect(typeof process.env.has).toBe("function");
      expect(typeof process.env.getRequired).toBe("function");
    });

    it("should not extend process.env when extendProcessEnv is false", () => {
      const originalGetString = process.env.getString;
      const originalGetNumber = process.env.getNumber;
      const originalGetBoolean = process.env.getBoolean;
      const originalHas = process.env.has;
      const originalGetRequired = process.env.getRequired;

      EnvManager.bootstrap({ envPaths: [], extendProcessEnv: false });

      expect(process.env.getString).toBe(originalGetString);
      expect(process.env.getNumber).toBe(originalGetNumber);
      expect(process.env.getBoolean).toBe(originalGetBoolean);
      expect(process.env.has).toBe(originalHas);
      expect(process.env.getRequired).toBe(originalGetRequired);
    });

    it("should extend process.env when extendProcessEnv is explicitly true", () => {
      EnvManager.bootstrap({ envPaths: [], extendProcessEnv: true });
      expect(typeof process.env.getString).toBe("function");
      expect(typeof process.env.getNumber).toBe("function");
      expect(typeof process.env.getBoolean).toBe("function");
      expect(typeof process.env.has).toBe("function");
      expect(typeof process.env.getRequired).toBe("function");
    });
  });

  describe("getArray", () => {
    it("should parse comma-separated values", () => {
      process.env.HOSTS = "localhost,example.com,api.example.com";
      const manager = EnvManager.getInstance();
      expect(manager.getArray("HOSTS")).toEqual(["localhost", "example.com", "api.example.com"]);
    });

    it("should trim whitespace from values", () => {
      process.env.HOSTS = "  localhost , example.com ,  api.example.com  ";
      const manager = EnvManager.getInstance();
      expect(manager.getArray("HOSTS")).toEqual(["localhost", "example.com", "api.example.com"]);
    });

    it("should filter empty values", () => {
      process.env.HOSTS = "localhost,,example.com,";
      const manager = EnvManager.getInstance();
      expect(manager.getArray("HOSTS")).toEqual(["localhost", "example.com"]);
    });

    it("should return default for missing key", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getArray("MISSING_HOSTS")).toEqual([]);
      expect(manager.getArray("MISSING_HOSTS", ["default"])).toEqual(["default"]);
    });

    it("should return default for empty string", () => {
      process.env.HOSTS = "";
      const manager = EnvManager.getInstance();
      expect(manager.getArray("HOSTS", ["default"])).toEqual(["default"]);
    });

    it("should use custom separator", () => {
      process.env.PORTS = "8080:8081:8082";
      const manager = EnvManager.getInstance();
      expect(manager.getArray("PORTS", [], ":")).toEqual(["8080", "8081", "8082"]);
    });

    it("should handle single value", () => {
      process.env.HOSTS = "localhost";
      const manager = EnvManager.getInstance();
      expect(manager.getArray("HOSTS")).toEqual(["localhost"]);
    });
  });

  describe("getJson", () => {
    it("should parse valid JSON object", () => {
      process.env.CONFIG = '{"host":"localhost","port":3000}';
      const manager = EnvManager.getInstance();
      const config = manager.getJson<{ host: string; port: number }>("CONFIG");
      expect(config).toEqual({ host: "localhost", port: 3000 });
    });

    it("should parse valid JSON array", () => {
      process.env.ITEMS = '["a","b","c"]';
      const manager = EnvManager.getInstance();
      expect(manager.getJson<string[]>("ITEMS")).toEqual(["a", "b", "c"]);
    });

    it("should return default for missing key", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getJson("MISSING_CONFIG", { default: true })).toEqual({ default: true });
    });

    it("should return undefined for missing key without default", () => {
      const manager = EnvManager.getInstance();
      expect(manager.getJson("MISSING_CONFIG")).toBeUndefined();
    });

    it("should return default for invalid JSON", () => {
      process.env.CONFIG = "not-valid-json";
      const manager = EnvManager.getInstance();
      expect(manager.getJson("CONFIG", { fallback: true })).toEqual({ fallback: true });
    });

    it("should throw EnvParseError for invalid JSON without default", () => {
      process.env.CONFIG = "not-valid-json";
      const manager = EnvManager.getInstance();
      expect(() => manager.getJson("CONFIG")).toThrow();
    });

    it("should return default for empty string", () => {
      process.env.CONFIG = "";
      const manager = EnvManager.getInstance();
      expect(manager.getJson("CONFIG", { empty: true })).toEqual({ empty: true });
    });
  });

  describe("getRequiredJson", () => {
    it("should parse valid JSON", () => {
      process.env.CONFIG = '{"required":true}';
      const manager = EnvManager.getInstance();
      expect(manager.getRequiredJson("CONFIG")).toEqual({ required: true });
    });

    it("should throw MissingEnvError for missing key", () => {
      const manager = EnvManager.getInstance();
      expect(() => manager.getRequiredJson("MISSING_CONFIG")).toThrow();
    });

    it("should throw MissingEnvError for empty string", () => {
      process.env.CONFIG = "";
      const manager = EnvManager.getInstance();
      expect(() => manager.getRequiredJson("CONFIG")).toThrow();
    });

    it("should throw EnvParseError for invalid JSON", () => {
      process.env.CONFIG = "not-valid-json";
      const manager = EnvManager.getInstance();
      expect(() => manager.getRequiredJson("CONFIG")).toThrow();
    });

    it("should use custom error message", () => {
      const manager = EnvManager.getInstance();
      expect(() => manager.getRequiredJson("MISSING_CONFIG", "Custom error")).toThrow(
        "Custom error"
      );
    });
  });

  describe("getValidatedString", () => {
    it("should return value when validation passes", () => {
      process.env.URL = "https://example.com";
      const manager = EnvManager.getInstance();
      const result = manager.getValidatedString("URL", (v) => v.startsWith("https://"));
      expect(result).toBe("https://example.com");
    });

    it("should throw EnvValidationError when validation fails", () => {
      process.env.URL = "http://example.com";
      const manager = EnvManager.getInstance();
      expect(() =>
        manager.getValidatedString("URL", (v) => v.startsWith("https://") || "Must use HTTPS")
      ).toThrow("Must use HTTPS");
    });

    it("should use default value when key not set", () => {
      const manager = EnvManager.getInstance();
      const result = manager.getValidatedString(
        "MISSING_URL",
        (v) => v.startsWith("https://"),
        "https://default.com"
      );
      expect(result).toBe("https://default.com");
    });

    it("should validate default value too", () => {
      const manager = EnvManager.getInstance();
      expect(() =>
        manager.getValidatedString(
          "MISSING_URL",
          (v) => v.startsWith("https://") || "Must use HTTPS",
          "http://bad.com"
        )
      ).toThrow("Must use HTTPS");
    });
  });

  describe("getValidatedNumber", () => {
    it("should return value when validation passes", () => {
      process.env.PORT = "3000";
      const manager = EnvManager.getInstance();
      const result = manager.getValidatedNumber("PORT", (v) => v >= 1 && v <= 65535);
      expect(result).toBe(3000);
    });

    it("should throw EnvValidationError when validation fails", () => {
      process.env.PORT = "99999";
      const manager = EnvManager.getInstance();
      expect(() =>
        manager.getValidatedNumber("PORT", (v) => (v >= 1 && v <= 65535) || "Port must be 1-65535")
      ).toThrow("Port must be 1-65535");
    });

    it("should use default value when key not set", () => {
      const manager = EnvManager.getInstance();
      const result = manager.getValidatedNumber("MISSING_PORT", (v) => v > 0, 8080);
      expect(result).toBe(8080);
    });
  });

  describe("logger adapter", () => {
    it("should use custom logger when provided", () => {
      const customLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      EnvManager.setLogger(customLogger);
      expect(EnvManager.getLogger()).toBe(customLogger);

      // Clean up
      EnvManager.setLogger(null);
      expect(EnvManager.getLogger()).toBeNull();
    });

    it("should use defaultLog when no logger set and bootstrap loads a file", () => {
      EnvManager.resetInstance();
      EnvManager.resetBootstrap();
      EnvManager.setLogger(null);
      const testEnvPath = path.join(__dirname, ".test-default-log.env");
      fs.writeFileSync(testEnvPath, "DEFAULT_LOG_VAR=value\n");
      const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
      try {
        EnvManager.bootstrap({ envPaths: [testEnvPath] });
        expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("Loaded:"));
      } finally {
        stderrSpy.mockRestore();
        fs.unlinkSync(testEnvPath);
        EnvManager.resetBootstrap();
        EnvManager.resetInstance();
      }
    });
  });
});
