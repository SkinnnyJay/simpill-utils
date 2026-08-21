import {
  DECORRELATED_JITTER_MULTIPLIER,
  FULL_JITTER_DEFAULT_BASE_MS,
  FULL_JITTER_DEFAULT_CAP_MS,
  VALUE_2,
  WITH_JITTER_DEFAULT_FACTOR,
} from "./constants";

export interface WithJitterOptions {
  factor?: number;
  maxMs?: number;
}

/** Add jitter to delay ms; result in [ms*(1-factor), ms*(1+factor)], optionally capped by maxMs. */
export function withJitter(ms: number, options?: WithJitterOptions): number {
  const factor = options?.factor ?? WITH_JITTER_DEFAULT_FACTOR;
  const maxMs = options?.maxMs;
  const delta = ms * factor;
  const low = Math.max(0, ms - delta);
  const high = ms + delta;
  const jittered = low + Math.random() * (high - low);
  const result = Math.round(jittered);
  if (maxMs != null && result > maxMs) return maxMs;
  return result;
}

/** Options for AWS-style backoff jitter (full / decorrelated). */
export interface BackoffJitterOptions {
  /** Delay ceiling for attempt 0 (default 100ms). */
  baseMs?: number;
  /** Hard cap on any computed delay (default 30s). */
  capMs?: number;
}

/**
 * AWS "Full Jitter": sleep = random(0, min(capMs, baseMs * 2^attempt)).
 * Lowest total load on a recovering upstream of the AWS-simulated strategies.
 * @param attempt - Zero-based retry attempt number
 */
export function fullJitter(attempt: number, options?: BackoffJitterOptions): number {
  const baseMs = options?.baseMs ?? FULL_JITTER_DEFAULT_BASE_MS;
  const capMs = options?.capMs ?? FULL_JITTER_DEFAULT_CAP_MS;
  const ceiling = Math.min(capMs, baseMs * VALUE_2 ** attempt);
  return Math.round(Math.random() * ceiling);
}

/**
 * AWS "Decorrelated Jitter": sleep = min(capMs, random(baseMs, prev * 3)),
 * starting from prev = baseMs. Stateful — returns a next() function that
 * yields successive delays; create one per retry loop.
 */
export function createDecorrelatedJitter(options?: BackoffJitterOptions): () => number {
  const baseMs = options?.baseMs ?? FULL_JITTER_DEFAULT_BASE_MS;
  const capMs = options?.capMs ?? FULL_JITTER_DEFAULT_CAP_MS;
  let previous = baseMs;
  return (): number => {
    const high = previous * DECORRELATED_JITTER_MULTIPLIER;
    previous = Math.min(capMs, baseMs + Math.random() * (high - baseMs));
    return Math.round(previous);
  };
}
