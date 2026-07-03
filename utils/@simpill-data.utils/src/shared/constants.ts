/** Shared constants for data.utils. */

export const ERROR_CONFIG_MISSING_KEY_PREFIX = "Config missing required key: " as const;

/** Validation: expected string. */
export const ERROR_VALIDATION_EXPECTED_STRING = "Expected string" as const;
/** Validation: expected number. */
export const ERROR_VALIDATION_EXPECTED_NUMBER = "Expected number" as const;
/** Validation: expected object. */
export const ERROR_VALIDATION_EXPECTED_OBJECT = "Expected object" as const;
/** Validation: expected boolean. */
export const ERROR_VALIDATION_EXPECTED_BOOLEAN = "Expected boolean" as const;
/** Validation: expected array. */
export const ERROR_VALIDATION_EXPECTED_ARRAY = "Expected array" as const;
/** Validation: element failure prefix ("Invalid element at index <i>: <message>"). */
export const ERROR_VALIDATION_ELEMENT_AT_INDEX_PREFIX = "Invalid element at index " as const;
/** Validation: enum failure prefix ("Expected one of: a, b"). */
export const ERROR_VALIDATION_EXPECTED_ONE_OF_PREFIX = "Expected one of: " as const;
/** searchObject onCycle: "throw" message. */
export const ERROR_SEARCH_CIRCULAR_REFERENCE =
  "Circular reference encountered in searchObject" as const;
