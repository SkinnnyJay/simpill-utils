/**
 * Number helpers: type guards, coercion, clamp, round, range, lerp, sum, avg.
 */

/** Type guard: value is a finite number (excludes NaN, ±Infinity). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Type guard: value is an integer (number and integer). */
export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

/** Clamp value between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Round value to given decimal places. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** Math.max(0, Math.floor(decimals));
  return Math.round(value * factor) / factor;
}

/** Parse to integer; returns fallback for NaN/invalid. */
export function toInt(value: unknown, fallback?: number): number {
  const n = typeof value === "number" ? value : Number(value);
  const i = Number.isInteger(n) ? n : Math.floor(n);
  if (!Number.isFinite(i)) return fallback ?? 0;
  return i;
}

/** Parse to float; returns fallback for NaN/invalid. */
export function toFloat(value: unknown, fallback?: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback ?? 0;
  return n;
}

export type IsInRangeOptions = {
  /** If true, min and max are inclusive (default true). */
  inclusive?: boolean;
};

/** True if value is in [min, max] (or (min, max) when inclusive: false). */
export function isInRange(
  value: number,
  min: number,
  max: number,
  options: IsInRangeOptions = {},
): boolean {
  const inclusive = options.inclusive ?? true;
  if (inclusive) return value >= min && value <= max;
  return value > min && value < max;
}

/** Random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/** Linear interpolation: (1-t)*a + t*b. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Sum of numbers. */
export function sum(values: number[]): number {
  return values.reduce((acc, n) => acc + n, 0);
}

/** Average of numbers; 0 for empty array. */
export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}
