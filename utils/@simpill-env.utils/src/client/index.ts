// createEnv and the parse helpers are Edge-safe (plain-record source,
// no fs/dotenv/node built-ins) — exported here so Edge users get schema
// validation and parsing without reaching into server code.
export {
  type CreateEnvOptions,
  createEnv,
  type EnvSource,
  type EnvSpec,
  type EnvSpecEntry,
  type InferEnvSpec,
} from "../shared/env-schema";
export { EnvSchemaError, type EnvSchemaIssue } from "../shared/errors";
export {
  parseBooleanEnvValue,
  parseBooleanEnvValueStrict,
  parseEnvEnum,
  parseEnvEnumStrict,
  parseNumberEnvValue,
  parseNumberEnvValueStrict,
} from "../shared/parse-helpers";
export { isSecretLikeKey, REDACTED_VALUE, redactEnvValue } from "../shared/redact";
export {
  getEdgeBoolean,
  getEdgeEnv,
  getEdgeNumber,
  getEdgeString,
  hasEdgeEnv,
  isEdgeDev,
  isEdgeProd,
} from "./env.edge";
