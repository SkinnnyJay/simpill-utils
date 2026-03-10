/**
 * Integration tests using fixture files.
 *
 * These tests validate parsing behavior using the sample env files
 * in __tests__/fixtures/ rather than creating temp files inline.
 */
import { EnvManager } from "../../../src/server/env.utils";
import {
  ENV_TEST_BOOLEANS,
  ENV_TEST_EDGE_CASES,
  ENV_TEST_NUMBERS,
  ENV_TEST_SAMPLE,
  ENV_TEST_STRINGS,
  EXPECTED_VALUES,
} from "../../fixtures";

describe("EnvManager with fixture files", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = originalEnv;
  });

  describe("env.test.sample (all types)", () => {
    it("should load the main sample fixture", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });
      expect(manager).toBeDefined();
    });

    it("should parse string values correctly", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });

      expect(manager.getString("TEST_STRING_SIMPLE")).toBe(
        EXPECTED_VALUES.strings.TEST_STRING_SIMPLE
      );
      expect(manager.getString("TEST_STRING_WITH_SPACES")).toBe(
        EXPECTED_VALUES.strings.TEST_STRING_WITH_SPACES
      );
      expect(manager.getString("TEST_STRING_URL")).toBe(EXPECTED_VALUES.strings.TEST_STRING_URL);
      expect(manager.getString("TEST_STRING_PATH")).toBe(EXPECTED_VALUES.strings.TEST_STRING_PATH);
    });

    it("should parse quoted strings correctly", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });

      expect(manager.getString("TEST_STRING_SINGLE_QUOTED")).toBe(
        EXPECTED_VALUES.strings.TEST_STRING_SINGLE_QUOTED
      );
      expect(manager.getString("TEST_STRING_DOUBLE_QUOTED")).toBe(
        EXPECTED_VALUES.strings.TEST_STRING_DOUBLE_QUOTED
      );
      expect(manager.getString("TEST_STRING_QUOTED_WITH_SPACES")).toBe(
        EXPECTED_VALUES.strings.TEST_STRING_QUOTED_WITH_SPACES
      );
    });

    it("should parse number values correctly", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });

      expect(manager.getNumber("TEST_NUMBER_INTEGER")).toBe(
        EXPECTED_VALUES.numbers.TEST_NUMBER_INTEGER
      );
      expect(manager.getNumber("TEST_NUMBER_ZERO")).toBe(EXPECTED_VALUES.numbers.TEST_NUMBER_ZERO);
      expect(manager.getNumber("TEST_NUMBER_NEGATIVE")).toBe(
        EXPECTED_VALUES.numbers.TEST_NUMBER_NEGATIVE
      );
      expect(manager.getNumber("TEST_NUMBER_PORT")).toBe(EXPECTED_VALUES.numbers.TEST_NUMBER_PORT);
      expect(manager.getNumber("TEST_NUMBER_TIMEOUT")).toBe(
        EXPECTED_VALUES.numbers.TEST_NUMBER_TIMEOUT
      );
    });

    it("should return default for invalid numbers", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });
      const defaultValue = 999;

      expect(manager.getNumber("TEST_NUMBER_INVALID", defaultValue)).toBe(defaultValue);
    });

    it("should parse truthy boolean values correctly", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });

      expect(manager.getBoolean("TEST_BOOL_TRUE_LOWER")).toBe(true);
      expect(manager.getBoolean("TEST_BOOL_TRUE_UPPER")).toBe(true);
      expect(manager.getBoolean("TEST_BOOL_TRUE_MIXED")).toBe(true);
      expect(manager.getBoolean("TEST_BOOL_ONE")).toBe(true);
    });

    it("should parse falsy boolean values correctly", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });

      expect(manager.getBoolean("TEST_BOOL_FALSE_LOWER")).toBe(false);
      expect(manager.getBoolean("TEST_BOOL_FALSE_UPPER")).toBe(false);
      expect(manager.getBoolean("TEST_BOOL_FALSE_MIXED")).toBe(false);
      expect(manager.getBoolean("TEST_BOOL_ZERO")).toBe(false);
    });

    it("should return default for invalid booleans", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_SAMPLE });

      // Invalid values should return the default
      expect(manager.getBoolean("TEST_BOOL_INVALID", true)).toBe(true);
      expect(manager.getBoolean("TEST_BOOL_INVALID", false)).toBe(false);
      expect(manager.getBoolean("TEST_BOOL_YES", false)).toBe(false);
      expect(manager.getBoolean("TEST_BOOL_NO", true)).toBe(true);
    });
  });

  describe("env.test.strings (string-focused)", () => {
    it("should load string fixture", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_STRINGS });

      expect(manager.getString("STRING_BASIC")).toBe("hello");
      expect(manager.getString("STRING_WITH_SPACES")).toBe("hello world");
      expect(manager.getString("STRING_URL")).toBe("https://api.example.com/v1/users?active=true");
      expect(manager.getString("STRING_EMAIL")).toBe("user@example.com");
    });

    it("should handle quoted strings", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_STRINGS });

      expect(manager.getString("STRING_SINGLE_QUOTED")).toBe("single quoted");
      expect(manager.getString("STRING_DOUBLE_QUOTED")).toBe("double quoted");
    });

    it("should handle JSON and structured data as strings", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_STRINGS });

      const jsonValue = manager.getString("STRING_JSON");
      expect(jsonValue).toContain("name");
      expect(jsonValue).toContain("test");

      expect(manager.getString("STRING_CSV")).toBe("one,two,three,four");
    });

    it("should handle unicode and extended characters", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_STRINGS });

      expect(manager.getString("STRING_EXTENDED_ASCII")).toContain("Hello");
      expect(manager.getString("STRING_ACCENTS")).toContain("café");
    });
  });

  describe("env.test.numbers (number-focused)", () => {
    it("should load number fixture", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_NUMBERS });

      expect(manager.getNumber("NUMBER_POSITIVE")).toBe(42);
      expect(manager.getNumber("NUMBER_ZERO")).toBe(0);
      expect(manager.getNumber("NUMBER_NEGATIVE")).toBe(-100);
    });

    it("should handle common use case numbers", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_NUMBERS });

      expect(manager.getNumber("NUMBER_PORT")).toBe(3000);
      expect(manager.getNumber("NUMBER_TIMEOUT_MS")).toBe(30000);
      expect(manager.getNumber("NUMBER_MAX_RETRIES")).toBe(3);
      expect(manager.getNumber("NUMBER_BATCH_SIZE")).toBe(100);
    });

    it("should handle edge case numbers", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_NUMBERS });

      // parseInt parses leading zeros as decimal
      expect(manager.getNumber("NUMBER_LEADING_ZEROS")).toBe(7);
    });

    it("should return default for invalid numbers", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_NUMBERS });
      const defaultValue = -1;

      expect(manager.getNumber("NUMBER_INVALID_TEXT", defaultValue)).toBe(defaultValue);
      expect(manager.getNumber("NUMBER_INVALID_SPECIAL", defaultValue)).toBe(defaultValue);
      expect(manager.getNumber("NUMBER_INVALID_NAN", defaultValue)).toBe(defaultValue);
    });

    it("should handle Number() parsing edge cases", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_NUMBERS });

      // Number("3.14") returns 3.14
      expect(manager.getNumber("NUMBER_INVALID_FLOAT")).toBe(3.14);

      // Number("42abc") returns NaN, so we get the default (0)
      // This is stricter than parseFloat which would return 42
      expect(manager.getNumber("NUMBER_INVALID_MIXED")).toBe(0);
    });
  });

  describe("env.test.booleans (boolean-focused)", () => {
    it("should load boolean fixture", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_BOOLEANS });
      expect(manager).toBeDefined();
    });

    it("should parse all truthy variations", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_BOOLEANS });

      expect(manager.getBoolean("BOOL_TRUE_LOWER")).toBe(true);
      expect(manager.getBoolean("BOOL_TRUE_UPPER")).toBe(true);
      expect(manager.getBoolean("BOOL_TRUE_MIXED")).toBe(true);
      expect(manager.getBoolean("BOOL_TRUE_CAMEL")).toBe(true);
      expect(manager.getBoolean("BOOL_ONE")).toBe(true);
    });

    it("should parse all falsy variations", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_BOOLEANS });

      expect(manager.getBoolean("BOOL_FALSE_LOWER")).toBe(false);
      expect(manager.getBoolean("BOOL_FALSE_UPPER")).toBe(false);
      expect(manager.getBoolean("BOOL_FALSE_MIXED")).toBe(false);
      expect(manager.getBoolean("BOOL_FALSE_CAMEL")).toBe(false);
      expect(manager.getBoolean("BOOL_ZERO")).toBe(false);
    });

    it("should return default for non-standard boolean strings", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_BOOLEANS });

      // These are NOT recognized as booleans
      expect(manager.getBoolean("BOOL_INVALID_YES", false)).toBe(false);
      expect(manager.getBoolean("BOOL_INVALID_NO", true)).toBe(true);
      expect(manager.getBoolean("BOOL_INVALID_ON", false)).toBe(false);
      expect(manager.getBoolean("BOOL_INVALID_OFF", true)).toBe(true);
      expect(manager.getBoolean("BOOL_INVALID_Y", false)).toBe(false);
      expect(manager.getBoolean("BOOL_INVALID_N", true)).toBe(true);
    });
  });

  describe("env.test.edge-cases (edge cases)", () => {
    it("should load edge case fixture", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_EDGE_CASES });
      expect(manager).toBeDefined();
    });

    it("should handle equals sign in value", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_EDGE_CASES });

      expect(manager.getString("EDGE_EQUALS_SIGN")).toBe("key=value=more");
    });

    it("should handle empty values", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_EDGE_CASES });

      expect(manager.getString("EDGE_EMPTY_VALUE")).toBe("");
      expect(manager.getString("EDGE_EMPTY_VALUE", "default")).toBe("");
    });

    it("should handle long values", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_EDGE_CASES });

      const longValue = manager.getString("EDGE_LONG_VALUE");
      expect(longValue.length).toBeGreaterThan(100);
    });

    it("should handle path-like values", () => {
      const manager = EnvManager.getInstance({ envPath: ENV_TEST_EDGE_CASES });

      expect(manager.getString("EDGE_FORWARD_SLASH")).toBe("/path/to/file");
    });
  });

  describe("multiple fixture files", () => {
    it("should load multiple fixtures and merge values", () => {
      const manager = EnvManager.getInstance({
        envPaths: [ENV_TEST_STRINGS, ENV_TEST_NUMBERS],
      });

      // From strings fixture
      expect(manager.getString("STRING_BASIC")).toBe("hello");

      // From numbers fixture
      expect(manager.getNumber("NUMBER_PORT")).toBe(3000);
    });

    it("should allow later files to override earlier ones with overload", () => {
      const manager = EnvManager.getInstance({
        envPaths: [ENV_TEST_SAMPLE, ENV_TEST_NUMBERS],
        overload: true,
      });

      // Both fixtures have number values, overload should use the later one
      expect(manager.getNumber("NUMBER_PORT")).toBe(3000);
    });
  });
});
