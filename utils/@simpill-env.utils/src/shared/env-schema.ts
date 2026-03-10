/**
 * Schema-style env validation: define keys with type and default, get a typed object.
 * Use with Env.getValue() + parse helpers (parseNumberEnvValue, parseBooleanEnvValueStrict).
 * For full schema validation (nested objects, arrays, custom rules) use zod or joi on top.
 */

export type EnvSpecEntry =
  | { type: "string"; default?: string }
  | { type: "number"; default?: number }
  | { type: "boolean"; default?: boolean };

export type EnvSpec = Record<string, EnvSpecEntry>;
