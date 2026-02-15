/**
 * Typed error classes for @simpill/env.utils package.
 * All errors extend EnvError for unified error handling.
 */

export const ENV_ERROR_CODE = {
  /** Base error code for generic env errors */
  ENV_ERROR: "ENV_ERROR",
  /** Required environment variable is not set */
  ENV_MISSING: "ENV_MISSING",
  /** Failed to parse environment variable value */
  ENV_PARSE: "ENV_PARSE",
  /** Environment variable value failed validation */
  ENV_VALIDATION: "ENV_VALIDATION",
  /** Failed to decrypt an encrypted environment variable */
  ENV_DECRYPT: "ENV_DECRYPT",
} as const;

export type EnvErrorCode = (typeof ENV_ERROR_CODE)[keyof typeof ENV_ERROR_CODE];

/** Base error class for all @simpill/env.utils errors. */
export class EnvError extends Error {
  public readonly code: EnvErrorCode;

  constructor(message: string, code: EnvErrorCode = ENV_ERROR_CODE.ENV_ERROR) {
    super(message);
    this.name = "EnvError";
    this.code = code;
    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** Error thrown when a required environment variable is missing. */
export class MissingEnvError extends EnvError {
  public readonly key: string;

  constructor(key: string, message?: string) {
    super(
      message ?? `Required environment variable "${key}" is not set`,
      ENV_ERROR_CODE.ENV_MISSING
    );
    this.name = "MissingEnvError";
    this.key = key;
  }
}

import type { EnvParseType } from "./constants";

// Re-export for convenience
export type { EnvParseType } from "./constants";

/** Error thrown when an environment variable value cannot be parsed. */
export class EnvParseError extends EnvError {
  public readonly key: string;
  public readonly rawValue: string;
  public readonly expectedType: EnvParseType;

  constructor(key: string, rawValue: string, expectedType: EnvParseType) {
    super(
      `Failed to parse environment variable "${key}" as ${expectedType}: got "${rawValue}"`,
      ENV_ERROR_CODE.ENV_PARSE
    );
    this.name = "EnvParseError";
    this.key = key;
    this.rawValue = rawValue;
    this.expectedType = expectedType;
  }
}

/** Error thrown when an environment variable value fails validation. */
export class EnvValidationError extends EnvError {
  public readonly key: string;
  public readonly value: string | number | boolean;
  public readonly reason: string;

  constructor(key: string, value: string | number | boolean, reason: string) {
    super(
      `Environment variable "${key}" failed validation: ${reason} (got ${JSON.stringify(value)})`,
      ENV_ERROR_CODE.ENV_VALIDATION
    );
    this.name = "EnvValidationError";
    this.key = key;
    this.value = value;
    this.reason = reason;
  }
}

/** Error thrown when decryption of an encrypted environment variable fails. */
export class EnvDecryptError extends EnvError {
  public readonly key: string;
  public readonly reason: string;

  constructor(key: string, reason: string) {
    super(`Failed to decrypt environment variable "${key}": ${reason}`, ENV_ERROR_CODE.ENV_DECRYPT);
    this.name = "EnvDecryptError";
    this.key = key;
    this.reason = reason;
  }
}
