import { WITH_JITTER_DEFAULT_FACTOR } from "./constants";

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
