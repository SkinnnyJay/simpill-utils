import type { Gate, RunOptions } from "@simpill/async.utils";
import type { CircuitBreakerMetrics, CircuitBreakerOptions, CircuitState } from "../shared";
import {
  CIRCUIT_BREAKER_DEFAULT_FAILURE_THRESHOLD,
  CIRCUIT_BREAKER_DEFAULT_HALF_OPEN_MAX_CALLS,
  CIRCUIT_BREAKER_DEFAULT_OPEN_MS,
  CIRCUIT_BREAKER_DEFAULT_SUCCESS_THRESHOLD,
  CIRCUIT_BREAKER_ERROR,
  CLOSED,
  ERROR_NAME_ABORT,
  HALF_OPEN,
  OPEN,
  VALUE_0,
} from "../shared/constants";
import { CircuitOpenError, throwIfAborted } from "../shared/errors";

export type { CircuitState } from "../shared";
export { CircuitOpenError } from "../shared/errors";

/** Default failure filter: everything counts except caller-side aborts. */
const defaultShouldCountError = (error: unknown): boolean =>
  !(error instanceof Error && error.name === ERROR_NAME_ABORT);

export class CircuitBreaker implements Gate {
  private state: CircuitState = CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private halfOpenCalls = 0;
  private openUntil = 0;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly openMs: number;
  private readonly halfOpenMaxCalls: number;
  private readonly onStateChange?: (state: CircuitState, previousState: CircuitState) => void;
  private readonly shouldCountError: (error: unknown) => boolean;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? CIRCUIT_BREAKER_DEFAULT_FAILURE_THRESHOLD;
    this.successThreshold = options.successThreshold ?? CIRCUIT_BREAKER_DEFAULT_SUCCESS_THRESHOLD;
    this.openMs = options.openMs ?? CIRCUIT_BREAKER_DEFAULT_OPEN_MS;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls ?? CIRCUIT_BREAKER_DEFAULT_HALF_OPEN_MAX_CALLS;
    this.onStateChange = options.onStateChange;
    this.shouldCountError = options.shouldCountError ?? defaultShouldCountError;
  }

  private setState(next: CircuitState): void {
    if (next === this.state) return;
    const previous = this.state;
    this.state = next;
    this.onStateChange?.(next, previous);
  }

  getState(): CircuitState {
    if (this.state === OPEN && Date.now() >= this.openUntil) {
      this.setState(HALF_OPEN);
      this.halfOpenCalls = 0;
      this.successCount = 0;
    }
    return this.state;
  }

  /** Snapshot of internals for metrics/observability. */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      halfOpenInFlight: this.halfOpenCalls,
      openUntil: this.openUntil,
    };
  }

  /** Manually trip the breaker open for openMs (or the configured default). */
  open(openMs?: number): void {
    this.openUntil = Date.now() + (openMs ?? this.openMs);
    this.setState(OPEN);
  }

  /** Manually close the breaker and reset all counters. */
  close(): void {
    this.failureCount = VALUE_0;
    this.successCount = VALUE_0;
    this.halfOpenCalls = VALUE_0;
    this.setState(CLOSED);
  }

  async run<T>(fn: () => Promise<T>, options?: RunOptions): Promise<T> {
    throwIfAborted(options?.signal);
    const state = this.getState();
    if (state === OPEN) {
      throw new CircuitOpenError(CIRCUIT_BREAKER_ERROR.OPEN, OPEN);
    }
    if (state === HALF_OPEN && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new CircuitOpenError(CIRCUIT_BREAKER_ERROR.HALF_OPEN_MAX_CALLS, HALF_OPEN);
    }

    // In half-open, halfOpenCalls tracks IN-FLIGHT probes: incremented on
    // start, released on settle. The pre-fix code never decremented, turning
    // the documented concurrency cap into a one-shot budget (deadlock when
    // successThreshold > halfOpenMaxCalls).
    const probing = this.state === HALF_OPEN;
    if (probing) this.halfOpenCalls++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      if (this.shouldCountError(err)) this.recordFailure();
      throw err;
    } finally {
      if (probing) this.halfOpenCalls = Math.max(VALUE_0, this.halfOpenCalls - 1);
    }
  }

  private recordSuccess(): void {
    if (this.state === HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.setState(CLOSED);
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private recordFailure(): void {
    if (this.state === HALF_OPEN) {
      this.openUntil = Date.now() + this.openMs;
      this.setState(OPEN);
      return;
    }
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.openUntil = Date.now() + this.openMs;
      this.setState(OPEN);
    }
  }
}
