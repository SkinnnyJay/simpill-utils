export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  openMs?: number;
  halfOpenMaxCalls?: number;
  /** Optional callback when state changes (e.g. for metrics/logging). */
  onStateChange?: (state: CircuitState, previousState: CircuitState) => void;
  /**
   * Decide whether a thrown error counts as a breaker failure.
   * Default: everything counts EXCEPT AbortError (a caller cancelling its own
   * request is not evidence the dependency is unhealthy).
   */
  shouldCountError?: (error: unknown) => boolean;
}

/** Snapshot of circuit breaker internals for metrics/observability. */
export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  halfOpenInFlight: number;
  /** Epoch ms when the open window ends (0 if never opened). */
  openUntil: number;
}

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

/** Token bucket: sustained rate + burst capacity (no boundary bursts). */
export interface TokenBucketOptions {
  /** Max tokens the bucket holds (burst size). Must be >= 1. */
  capacity: number;
  /** Tokens added per second (sustained rate). Must be > 0. */
  refillPerSecond: number;
}

export interface BulkheadOptions {
  maxConcurrency: number;
}

/** Options for createBulkhead. */
export interface BulkheadCreateOptions {
  /**
   * Max calls allowed to wait for a slot. When the queue is full, run()
   * rejects immediately with BulkheadRejectedError. Omit for unbounded.
   */
  maxQueue?: number;
}
