/**
 * Internal literal-audit constants. Not part of the public API.
 * Do not import from outside this package.
 */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_2 = 2;
export const VALUE_3 = 3;
export const VALUE_50 = 50;
export const VALUE_80 = 80;
export const ERROR = "error";
export const HANDLER_ERROR = "handler-error";
export const TIMEOUT_MS_1000 = 1000;
export const TIMEOUT_MS_5000 = 5000;

/** HTTP error message prefix (append status and body). */
export const ERROR_HTTP_RESPONSE_PREFIX = "HTTP " as const;
export const ERROR_HTTP_RESPONSE_SEP = ": " as const;
