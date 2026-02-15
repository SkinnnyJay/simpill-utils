/** Shared constants for resilience.utils (literal audit). */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_2 = 2;
export const VALUE_3 = 3;
export const VALUE_5 = 5;
export const VALUE_10 = 10;
export const VALUE_20 = 20;
export const VALUE_50 = 50;
export const VALUE_80 = 80;
export const CLOSED = "closed";
export const OPEN = "open";
export const HALF_OPEN = "half-open";
export const TIMEOUT_MS_1000 = 1000;
export const TIMEOUT_MS_2000 = 2000;
export const TIMEOUT_MS_5000 = 5000;
export const TIMEOUT_MS_10000 = 10000;
export const TIMEOUT_MS_60000 = 60000;

/** Circuit breaker: default failure count before opening. */
export const CIRCUIT_BREAKER_DEFAULT_FAILURE_THRESHOLD = 5;
/** Circuit breaker: default success count in half-open before closing. */
export const CIRCUIT_BREAKER_DEFAULT_SUCCESS_THRESHOLD = 2;
/** Circuit breaker: default time (ms) to stay open before half-open. */
export const CIRCUIT_BREAKER_DEFAULT_OPEN_MS = 60_000;
/** Circuit breaker: default max concurrent calls in half-open. */
export const CIRCUIT_BREAKER_DEFAULT_HALF_OPEN_MAX_CALLS = 3;

/** Common rate-limit window: 1 minute (ms). */
export const RATE_LIMITER_WINDOW_MS_ONE_MINUTE = 60_000;
/** Common rate-limit window: 1 second (ms). */
export const RATE_LIMITER_WINDOW_MS_ONE_SECOND = 1_000;
/** Jitter: default factor (0.2 = ±20%). */
export const WITH_JITTER_DEFAULT_FACTOR = 0.2;

/** Error message when operation is aborted (e.g. AbortSignal). */
export const ERROR_OPERATION_ABORTED = "Operation aborted." as const;
/** Error name for aborted operations (DOM standard). */
export const ERROR_NAME_ABORT = "AbortError" as const;

/** Circuit breaker error messages. */
export const CIRCUIT_BREAKER_ERROR = {
  OPEN: "Circuit breaker is open",
  HALF_OPEN_MAX_CALLS: "Circuit breaker half-open max calls reached",
} as const;

/** Retry result: default message when all retries fail. */
export const RETRY_FAILED_MESSAGE = "Retry failed" as const;
