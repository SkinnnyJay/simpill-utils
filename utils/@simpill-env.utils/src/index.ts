/**
 * Type-safe environment variable utilities for Node.js and Edge Runtime.
 * @see @simpill/env.utils/client - Edge-only utilities
 * @see @simpill/env.utils/server - Node.js-only utilities
 */

// Client/Edge
export {
  getEdgeBoolean,
  getEdgeEnv,
  getEdgeNumber,
  getEdgeString,
  hasEdgeEnv,
  isEdgeDev,
  isEdgeProd,
} from "./client";

// Server/Node.js
export {
  Env,
  type EnvLoggerAdapter,
  EnvManager,
  type EnvManagerOptions,
  extendProcessEnvPrototype,
  type IEnvManager,
} from "./server";

// Shared
export {
  BOOLEAN_FALSY,
  BOOLEAN_PARSING_DOCS,
  BOOLEAN_TRUTHY,
  type CreateEnvOptions,
  createEnv,
  DEFAULT_ENV_PATHS,
  DEFAULT_KEY_PATHS,
  DOTENVX_INTERNAL,
  ENCRYPTED_VALUE_PREFIX,
  ENV_ERROR_CODE,
  ENV_ERROR_MESSAGE,
  ENV_KEY,
  ENV_PARSE_TYPE,
  EnvDecryptError,
  EnvError,
  type EnvErrorCode,
  EnvParseError,
  type EnvParseType,
  EnvSchemaError,
  type EnvSchemaIssue,
  type EnvSource,
  type EnvSpec,
  type EnvSpecEntry,
  EnvValidationError,
  type InferEnvSpec,
  isSecretLikeKey,
  LOG_PREFIX,
  MissingEnvError,
  NODE_ENV,
  parseBooleanEnvValue,
  parseBooleanEnvValueStrict,
  parseEnvEnum,
  parseEnvEnumStrict,
  parseNumberEnvValue,
  parseNumberEnvValueStrict,
  REDACTED_VALUE,
  redactEnvValue,
  SECRET_KEY_PATTERN,
} from "./shared";
