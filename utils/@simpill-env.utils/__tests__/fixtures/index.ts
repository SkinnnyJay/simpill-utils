/**
 * Test Fixtures for @simpill/env.utils
 *
 * Provides paths to env sample files for integration tests.
 * These fixtures contain samples of each supported type.
 */
import * as path from "node:path";

/** Directory containing all fixture files */
export const FIXTURES_DIR = __dirname;

/** Main test fixture with samples of all types */
export const ENV_TEST_SAMPLE = path.join(FIXTURES_DIR, "env.test.sample");

/** String-only samples for focused string parsing tests */
export const ENV_TEST_STRINGS = path.join(FIXTURES_DIR, "env.test.strings");

/** Number-only samples for focused number parsing tests */
export const ENV_TEST_NUMBERS = path.join(FIXTURES_DIR, "env.test.numbers");

/** Boolean-only samples for focused boolean parsing tests */
export const ENV_TEST_BOOLEANS = path.join(FIXTURES_DIR, "env.test.booleans");

/** Edge case samples for error handling and boundary tests */
export const ENV_TEST_EDGE_CASES = path.join(FIXTURES_DIR, "env.test.edge-cases");

/** Encrypted samples for encryption detection and handling tests */
export const ENV_TEST_ENCRYPTED = path.join(FIXTURES_DIR, "env.test.encrypted");

/**
 * Expected values from env.test.sample fixture.
 * Use these constants to validate parsing behavior.
 */
export const EXPECTED_VALUES = {
  // String values
  strings: {
    TEST_STRING_SIMPLE: "hello",
    TEST_STRING_EMPTY: "",
    TEST_STRING_WITH_SPACES: "hello world",
    TEST_STRING_WITH_SPECIAL: "hello@world#123!",
    TEST_STRING_URL: "https://example.com/api/v1",
    TEST_STRING_PATH: "/var/log/app.log",
    TEST_STRING_SINGLE_QUOTED: "single quoted value",
    TEST_STRING_DOUBLE_QUOTED: "double quoted value",
    TEST_STRING_QUOTED_WITH_SPACES: "value with spaces",
  },

  // Number values
  numbers: {
    TEST_NUMBER_INTEGER: 42,
    TEST_NUMBER_ZERO: 0,
    TEST_NUMBER_NEGATIVE: -100,
    TEST_NUMBER_LARGE: 9999999,
    TEST_NUMBER_PORT: 3000,
    TEST_NUMBER_TIMEOUT: 30000,
  },

  // Invalid numbers (should return default)
  invalidNumbers: {
    TEST_NUMBER_INVALID: "not-a-number",
    TEST_NUMBER_FLOAT: "3.14", // parseInt returns 3
    TEST_NUMBER_MIXED: "42abc", // parseInt returns 42
  },

  // Boolean values
  booleans: {
    truthy: {
      TEST_BOOL_TRUE_LOWER: true,
      TEST_BOOL_TRUE_UPPER: true,
      TEST_BOOL_TRUE_MIXED: true,
      TEST_BOOL_ONE: true,
    },
    falsy: {
      TEST_BOOL_FALSE_LOWER: false,
      TEST_BOOL_FALSE_UPPER: false,
      TEST_BOOL_FALSE_MIXED: false,
      TEST_BOOL_ZERO: false,
    },
  },

  // Invalid booleans (should return default)
  invalidBooleans: {
    TEST_BOOL_INVALID: "maybe",
    TEST_BOOL_YES: "yes",
    TEST_BOOL_NO: "no",
  },
} as const;
