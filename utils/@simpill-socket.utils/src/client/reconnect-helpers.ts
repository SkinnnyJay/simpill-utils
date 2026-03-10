/** Reconnect backoff constants and jitter. */
import { JITTER_MODE_EQUAL, JITTER_MODE_FULL, JITTER_MODE_NONE } from "../shared/constants";

export const DEFAULT_MAX_ATTEMPTS = 10;
export const DEFAULT_INITIAL_DELAY_MS = 1000;
export const DEFAULT_MAX_DELAY_MS = 30_000;
export const DEFAULT_BACKOFF_MULTIPLIER = 1.5;
export const DEFAULT_JITTER_RATIO = 0.5;

export function applyJitter(
  delayMs: number,
  mode: "none" | "full" | "equal",
  ratio: number,
): number {
  if (mode === JITTER_MODE_NONE) return delayMs;
  const r = Math.random();
  if (mode === JITTER_MODE_FULL) return Math.floor(r * delayMs);
  if (mode === JITTER_MODE_EQUAL) {
    const low = delayMs * (1 - ratio);
    const high = delayMs * (1 + ratio);
    return Math.floor(low + r * (high - low));
  }
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
