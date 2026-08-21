/**
 * Internal literal-audit constants. Not part of the public API.
 * Do not import from outside this package.
 */
export const VALUE_0 = 0;
export const VALUE_50 = 50;
export const ERROR = "error";
export const HANDLER_ERROR = "handler-error";
export const TIMEOUT_MS_1000 = 1000;
export const TIMEOUT_MS_5000 = 5000;

/** HTTP error message prefix (append status and body). */
export const ERROR_HTTP_RESPONSE_PREFIX = "HTTP " as const;
export const ERROR_HTTP_RESPONSE_SEP = ": " as const;

/** substitutePath: a `:param` in the route has no matching value. */
export const CONTENT_TYPE_HEADER = "Content-Type" as const;
/** Header names are case-insensitive; compare against this to detect a caller override. */
export const CONTENT_TYPE_HEADER_LOWER = "content-type" as const;
export const CONTENT_TYPE_JSON = "application/json" as const;
export const ERROR_MISSING_PATH_PARAM_PREFIX = 'Missing value for path parameter ":' as const;
export const ERROR_MISSING_PATH_PARAM_SUFFIX = '".' as const;
