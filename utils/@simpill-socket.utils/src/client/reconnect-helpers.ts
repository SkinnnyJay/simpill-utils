/** Reconnect backoff constants and jitter. */
import { JITTER_MODE_DECORRELATED, JITTER_MODE_FULL, JITTER_MODE_NONE } from "../shared/constants";

export const DEFAULT_MAX_ATTEMPTS = 10;
export const DEFAULT_INITIAL_DELAY_MS = 1000;
export const DEFAULT_MAX_DELAY_MS = 30_000;
export const DEFAULT_BACKOFF_MULTIPLIER = 1.5;
export const DEFAULT_JITTER_RATIO = 0.5;
export const DEFAULT_MIN_UPTIME_MS = 5000;

export type JitterMode = "none" | "full" | "equal" | "decorrelated";

export function applyJitter(delayMs: number, mode: JitterMode, ratio: number): number {
  if (mode === JITTER_MODE_NONE) return delayMs;
  const r = Math.random();
  if (mode === JITTER_MODE_FULL) return Math.floor(r * delayMs);
  // "equal" (and any unknown mode, preserved for back-compat): delay in
  // [delay*(1-ratio), delay*(1+ratio)]
  const low = delayMs * (1 - ratio);
  const high = delayMs * (1 + ratio);
  return Math.floor(low + r * (high - low));
}

export function computeReconnectDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
): number {
  return Math.min(initialDelayMs * backoffMultiplier ** Math.max(0, attempt - 1), maxDelayMs);
}

/**
 * AWS decorrelated jitter (https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/):
 * next = min(maxDelay, random_between(initialDelay, prevDelay * 3)).
 * Spreads reconnect storms better than equal jitter while still growing.
 */
export function decorrelatedJitter(
  prevDelayMs: number,
  initialDelayMs: number,
  maxDelayMs: number,
): number {
  const low = initialDelayMs;
  const high = Math.max(low, prevDelayMs * 3);
  return Math.min(maxDelayMs, Math.floor(low + Math.random() * (high - low)));
}

export { JITTER_MODE_DECORRELATED };
