/**
 * Canonical env boolean parsing policy (strict).
 * Truthy: "true", "1". Falsy: "false", "0".
 * No "yes"/"no" to avoid ambiguity across packages.
 */
export const ENV_BOOLEAN_PARSING = {
  TRUTHY: ["true", "1"] as const,
  FALSY: ["false", "0"] as const,
} as const;

export type EnvBooleanTruthy = (typeof ENV_BOOLEAN_PARSING.TRUTHY)[number];
export type EnvBooleanFalsy = (typeof ENV_BOOLEAN_PARSING.FALSY)[number];
