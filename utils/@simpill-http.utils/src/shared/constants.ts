/** Shared constants for http.utils (literal audit). */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_3 = 3;
export const TIMEOUT_MS_1000 = 1000;
export const TIMEOUT_MS_5000 = 5000;
export const TIMEOUT_MS_10000 = 10000;
export const MS_PER_SECOND = 1000;
/** Default cap for Retry-After waits (mirrors undici RetryHandler maxTimeout). */
export const MAX_RETRY_AFTER_MS_DEFAULT = 30000;

/** Fetch retry: retryable status (append status code). */
export const ERROR_RETRYABLE_STATUS_PREFIX = "Retryable status: " as const;
/** Fallback abort message when a signal has no reason (very old runtimes). */
export const ERROR_REQUEST_ABORTED = "Request aborted" as const;

/** Fetch retry: default delay between attempts (ms). Non-zero to reduce thundering herd. */
export const RETRY_DEFAULT_DELAY_MS = 200;
/** Fetch retry: default exponential backoff multiplier per attempt. */
export const RETRY_DEFAULT_BACKOFF_MULTIPLIER = 1.5;
