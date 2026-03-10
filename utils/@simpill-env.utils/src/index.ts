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
  BOOLEAN_PARSING_DOCS,
  DEFAULT_KEY_PATHS,
  ENCRYPTED_VALUE_PREFIX,
  ENV_ERROR_CODE,
  EnvDecryptError,
  EnvError,
  type EnvErrorCode,
  EnvParseError,
  type EnvParseType,
  EnvValidationError,
  MissingEnvError,
  parseBooleanEnvValue,
  parseBooleanEnvValueStrict,
  parseNumberEnvValue,
  parseNumberEnvValueStrict,
} from "./shared";
