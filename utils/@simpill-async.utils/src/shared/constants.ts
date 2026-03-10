/** Shared constants for async.utils (literal audit). */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_2 = 2;
export const VALUE_3 = 3;
export const VALUE_4 = 4;
export const VALUE_5 = 5;
export const VALUE_6 = 6;
export const VALUE_10 = 10;
export const VALUE_20 = 20;
export const VALUE_42 = 42;
export const VALUE_50 = 50;
export const VALUE_60 = 60;
export const VALUE_80 = 80;
export const TIMEOUT_MS_1000 = 1000;
export const TIMEOUT_MS_2000 = 2000;

/** Polling: maxIntervalMs must be >= initialIntervalMs */
export const ERROR_POLLING_MAX_INTERVAL = "maxIntervalMs must be >= initialIntervalMs" as const;
/** Polling: invalid options prefix (append validation message) */
export const ERROR_POLLING_INVALID_OPTIONS_PREFIX = "Invalid polling options: " as const;

/** Semaphore: permits must be >= 1 */
export const ERROR_SEMAPHORE_PERMITS = "Semaphore permits must be >= 1" as const;
/** Concurrency/limit/queue: concurrency must be >= 1 */
export const ERROR_CONCURRENCY_MUST_BE_AT_LEAST_1 = "Concurrency must be >= 1" as const;
/** Queue/limit: maxQueueSize must be >= 1 */
export const ERROR_MAX_QUEUE_SIZE_MUST_BE_AT_LEAST_1 = "maxQueueSize must be >= 1" as const;

/** anyFulfilled: requires at least one promise */
export const ERROR_ANY_FULFILLED_REQUIRES_ONE =
  "anyFulfilled requires at least one promise." as const;
/** someFulfilled: count must be >= 1 */
export const ERROR_COUNT_MUST_BE_AT_LEAST_1 = "count must be >= 1." as const;
/** someFulfilled: count must be <= number of promises */
export const ERROR_COUNT_MUST_BE_AT_MOST_PROMISES = "count must be <= number of promises." as const;

/** Error name: AbortError (DOM standard). */
export const ERROR_NAME_ABORT = "AbortError" as const;
/** Error name: OverflowError (queue/limit full). */
export const ERROR_NAME_OVERFLOW = "OverflowError" as const;
/** Error name: AggregateError (multiple rejections). */
export const ERROR_NAME_AGGREGATE = "AggregateError" as const;

/** Message: operation aborted (e.g. AbortSignal). */
export const ERROR_OPERATION_ABORTED = "Operation aborted." as const;
/** Message: queue was cleared. */
export const ERROR_QUEUE_CLEARED = "Queue cleared." as const;
/** Message: queue is full. */
export const ERROR_QUEUE_IS_FULL = "Queue is full." as const;
/** Message: limit queue was cleared. */
export const ERROR_LIMIT_QUEUE_CLEARED = "Limit queue was cleared." as const;
/** Message: limit queue is full. */
export const ERROR_LIMIT_QUEUE_IS_FULL = "Limit queue is full." as const;
/** Message: all promises rejected (anyFulfilled). */
export const ERROR_ALL_PROMISES_REJECTED = "All promises rejected." as const;
/** Message: not enough promises fulfilled (someFulfilled). */
export const ERROR_NOT_ENOUGH_FULFILLED = "Not enough promises fulfilled." as const;
/** Message: retry failed (no last error). */
export const ERROR_RETRY_FAILED = "retry failed" as const;
/** Message: async operation failed (timeout/settle helpers). */
export const ERROR_ASYNC_OPERATION_FAILED = "Async operation failed" as const;

/** Overflow policy: drop oldest item. */
export const OVERFLOW_POLICY_DROP_OLDEST = "drop_oldest" as const;
/** Overflow policy: drop newest item. */
export const OVERFLOW_POLICY_DROP_NEWEST = "drop_newest" as const;
