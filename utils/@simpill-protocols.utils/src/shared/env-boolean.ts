/**
 * Canonical env boolean parsing policy (strict).
 * Truthy: "true", "1". Falsy: "false", "0".
 * No "yes"/"no" to avoid ambiguity across packages.
 */
export const ENV_BOOLEAN_PARSING = {
  TRUTHY: ["true", "1"] as const,
  FALSY: ["false", "0"] as const,
} as const;
Object.freeze(ENV_BOOLEAN_PARSING.TRUTHY);
Object.freeze(ENV_BOOLEAN_PARSING.FALSY);
Object.freeze(ENV_BOOLEAN_PARSING);

export type EnvBooleanTruthy = (typeof ENV_BOOLEAN_PARSING.TRUTHY)[number];
export type EnvBooleanFalsy = (typeof ENV_BOOLEAN_PARSING.FALSY)[number];

/**
 * Extended (yn-convention) boolean parsing policy for user-facing inputs
 * such as query strings and CLI flags: true/false, 1/0, yes/no, y/n, on/off
 * (case handling is the consumer's responsibility; values here are lowercase).
 * Env parsing should keep using the strict ENV_BOOLEAN_PARSING policy.
 */
export const ENV_BOOLEAN_PARSING_EXTENDED = {
  TRUTHY: ["true", "1", "yes", "y", "on"] as const,
  FALSY: ["false", "0", "no", "n", "off"] as const,
} as const;
Object.freeze(ENV_BOOLEAN_PARSING_EXTENDED.TRUTHY);
Object.freeze(ENV_BOOLEAN_PARSING_EXTENDED.FALSY);
Object.freeze(ENV_BOOLEAN_PARSING_EXTENDED);

export type EnvBooleanTruthyExtended = (typeof ENV_BOOLEAN_PARSING_EXTENDED.TRUTHY)[number];
export type EnvBooleanFalsyExtended = (typeof ENV_BOOLEAN_PARSING_EXTENDED.FALSY)[number];
