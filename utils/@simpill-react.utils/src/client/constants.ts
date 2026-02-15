/** Client constants for react.utils (literal audit). */

export const DEFAULT_DISPLAY_NAME = "SafeContext" as const;

/** useCtx outside provider: prefix (append name and suffix). */
export const ERROR_USE_CTX_OUTSIDE_PREFIX = "[" as const;
/** useCtx outside provider: suffix (after name). */
export const ERROR_USE_CTX_OUTSIDE_SUFFIX =
  "] useCtx must be used within the corresponding Provider." as const;
/** useSafeContext outside provider. */
export const ERROR_USE_SAFE_CONTEXT_OUTSIDE_PROVIDER =
  "useSafeContext must be used within the corresponding Provider." as const;
