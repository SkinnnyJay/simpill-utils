import {
  BULKHEAD_REJECTED_MESSAGE,
  ERROR_NAME_ABORT,
  ERROR_NAME_BULKHEAD_REJECTED,
  ERROR_NAME_CIRCUIT_OPEN,
  ERROR_OPERATION_ABORTED,
} from "./constants";
import type { CircuitState } from "./types";

/**
 * Thrown when the circuit breaker rejects a call (open, or half-open probe
 * budget exhausted). instanceof-checkable so callers can distinguish breaker
 * rejections from operation errors (parity with cockatiel BrokenCircuitError).
 */
export class CircuitOpenError extends Error {
  /** Breaker state at rejection time ("open" or "half-open"). */
  readonly state: CircuitState;

  constructor(message: string, state: CircuitState) {
    super(message);
    this.name = ERROR_NAME_CIRCUIT_OPEN;
    this.state = state;
  }
}

/** Thrown when a bulkhead's wait queue is full (fast-fail load shedding). */
export class BulkheadRejectedError extends Error {
  constructor() {
    super(BULKHEAD_REJECTED_MESSAGE);
    this.name = ERROR_NAME_BULKHEAD_REJECTED;
  }
}

/** Create a DOM-standard AbortError. */
export const createAbortError = (): Error => {
  const error = new Error(ERROR_OPERATION_ABORTED);
  error.name = ERROR_NAME_ABORT;
  return error;
};

/** Throw AbortError if the signal is already aborted. */
export const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw createAbortError();
};

/** Resolve after ms, or reject with AbortError the moment signal aborts. */
export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(createAbortError());
    };
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
  });
}
