import { ENV_BOOLEAN_PARSING } from "@simpill/protocols.utils";

/** Shared constants for environment variable utilities. */

export const NODE_ENV = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
  TEST: "test",
  STAGING: "staging",
} as const;

export type NodeEnvValue = (typeof NODE_ENV)[keyof typeof NODE_ENV];

/** Canonical boolean truthy (from @simpill/protocols.utils). */
export const BOOLEAN_TRUTHY = {
  TRUE: ENV_BOOLEAN_PARSING.TRUTHY[0],
  ONE: ENV_BOOLEAN_PARSING.TRUTHY[1],
} as const;

/** Canonical boolean falsy (from @simpill/protocols.utils). */
export const BOOLEAN_FALSY = {
  FALSE: ENV_BOOLEAN_PARSING.FALSY[0],
  ZERO: ENV_BOOLEAN_PARSING.FALSY[1],
} as const;

export const DEFAULT_ENV_PATHS = [".env.local", ".env"] as const;

export const LOG_PREFIX = {
  ENV_MANAGER: "[EnvManager]",
} as const;

export const ENV_PARSE_TYPE = {
  NUMBER: "number",
  BOOLEAN: "boolean",
  JSON: "json",
} as const;

export type EnvParseType = (typeof ENV_PARSE_TYPE)[keyof typeof ENV_PARSE_TYPE];

/**
 * Boolean parsing behavior:
 * - Truthy: "true", "1" (case-insensitive)
 * - Falsy: "false", "0" (case-insensitive)
 * - Other values return the default
 *
 * Note: "yes"/"no" are NOT supported to avoid ambiguity.
 * Use explicit "true"/"false" or "1"/"0" for clarity.
 */
export const BOOLEAN_PARSING_DOCS = {
  TRUTHY_VALUES: ["true", "1"],
  FALSY_VALUES: ["false", "0"],
} as const;

export const ENV_KEY = {
  NODE_ENV: "NODE_ENV",
  DOTENV_PRIVATE_KEY: "DOTENV_PRIVATE_KEY",
  DOTENV_PUBLIC_KEY: "DOTENV_PUBLIC_KEY",
} as const;

/** Prefix used by dotenvx for encrypted values */
export const ENCRYPTED_VALUE_PREFIX = "encrypted:" as const;

/** Default key file paths for dotenvx encryption */
export const DEFAULT_KEY_PATHS = [".env.keys"] as const;

/**
 * Error messages for environment variable operations
 */
export const ENV_ERROR_MESSAGE = {
  /** Generic validation failure message */
  VALIDATION_FAILED: "Validation failed",
  /** No private key available for decryption */
  NO_PRIVATE_KEY: "No private key available. Set DOTENV_PRIVATE_KEY or provide privateKey option.",
  /** Value is not encrypted (missing prefix) */
  NOT_ENCRYPTED: "Value is not encrypted (missing 'encrypted:' prefix)",
  /** Decryption failed - value unchanged */
  DECRYPTION_FAILED: "Decryption failed - value unchanged. Check that the private key is correct.",
} as const;

export type EnvErrorMessage = (typeof ENV_ERROR_MESSAGE)[keyof typeof ENV_ERROR_MESSAGE];

/**
 * Internal constants for dotenvx operations
 */
export const DOTENVX_INTERNAL = {
  /** Temporary key used for inline decryption */
  TEMP_DECRYPT_KEY: "__DOTENVX_DECRYPT_TEMP__",
  /** Placeholder key for inline encrypted values */
  INLINE_KEY: "(inline)",
} as const;
