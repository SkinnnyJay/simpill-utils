/**
 * Typed error classes for @simpill/env.utils package.
 * All errors extend EnvError for unified error handling.
 */

import { redactEnvValue } from "./redact";

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
  /** One or more variables failed schema validation (createEnv) */
  ENV_SCHEMA: "ENV_SCHEMA",
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
  /**
   * Server-side debug detail containing the raw value. Not included in `.message`
   * to prevent accidental credential disclosure when errors are serialized to clients.
   */
  public readonly detail: string;

  constructor(key: string, rawValue: string, expectedType: EnvParseType) {
    // Secret-like keys are redacted in BOTH the message and the stored
    // rawValue: serialized errors (logs, crash reporters, monitoring)
    // must never carry the secret either way.
    const safeValue = redactEnvValue(key, rawValue);
    super(
      `Failed to parse environment variable "${key}" as ${expectedType}: got "${safeValue}"`,
      ENV_ERROR_CODE.ENV_PARSE
    );
    this.name = "EnvParseError";
    this.key = key;
    this.rawValue = String(safeValue);
    this.expectedType = expectedType;
    this.detail = `Got: ${rawValue}`;
  }
}

/** Error thrown when an environment variable value fails validation. */
export class EnvValidationError extends EnvError {
  public readonly key: string;
  public readonly value: string | number | boolean;
  public readonly reason: string;
  /**
   * Server-side debug detail containing the rejected value. Not included in `.message`
   * to prevent accidental credential disclosure when errors are serialized to clients.
   */
  public readonly detail: string;

  constructor(key: string, value: string | number | boolean, reason: string) {
    // See EnvParseError: secret-like keys redact message AND stored value.
    const safeValue = redactEnvValue(key, value);
    super(
      `Environment variable "${key}" failed validation: ${reason} (got ${JSON.stringify(safeValue)})`,
      ENV_ERROR_CODE.ENV_VALIDATION
    );
    this.name = "EnvValidationError";
    this.key = key;
    this.value = safeValue;
    this.reason = reason;
    this.detail = `Got: ${JSON.stringify(value)}`;
  }
}

/** A single issue found by createEnv schema validation. */
export interface EnvSchemaIssue {
  readonly key: string;
  readonly code:
    | typeof ENV_ERROR_CODE.ENV_MISSING
    | typeof ENV_ERROR_CODE.ENV_PARSE
    | typeof ENV_ERROR_CODE.ENV_VALIDATION;
  /** Human-readable, already secret-redacted. */
  readonly message: string;
  /** Raw value as received, secret-redacted. undefined when missing. */
  readonly received?: string;
}

/**
 * Aggregate error thrown by createEnv when any variable fails.
 * Reports EVERY missing/invalid variable in one shot (envalid-style)
 * instead of dying on the first, so a broken deploy is fixed in one
 * iteration rather than N. All values are secret-redacted.
 */
export class EnvSchemaError extends EnvError {
  public readonly issues: readonly EnvSchemaIssue[];

  constructor(issues: readonly EnvSchemaIssue[]) {
    const lines = issues.map((issue) => `  ${issue.key}: ${issue.message}`);
    super(
      `Environment validation failed (${issues.length} issue${issues.length === 1 ? "" : "s"}):\n${lines.join("\n")}`,
      ENV_ERROR_CODE.ENV_SCHEMA
    );
    this.name = "EnvSchemaError";
    this.issues = issues;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
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
