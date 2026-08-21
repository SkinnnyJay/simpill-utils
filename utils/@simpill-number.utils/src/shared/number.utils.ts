/**
 * Number helpers: type guards, coercion, clamp, round, range, lerp, sum, avg.
 *
 * Correctness notes:
 * - `roundTo` uses exponent-shift rounding (decimal string shift) instead of
 *   `Math.round(v * 10**d) / 10**d`, which mis-rounds values like 1.005 due to
 *   binary representation error. Supports negative decimals and half-even mode.
 * - `clamp` follows the TC39 Math.clamp proposal: NaN propagates, and
 *   min > max throws a RangeError instead of silently returning nonsense.
 * - `lerp` follows the C++20 std::lerp reference implementation (P0811R3):
 *   exact at t=0 and t=1, monotonic, bounded, consistent.
 * - `sum` uses Neumaier compensated summation (same O(n), far lower error).
 * - `sumPrecise` returns the correctly rounded sum (native Math.sumPrecise,
 *   ES2026, when available; Shewchuk/fsum partials fallback otherwise).
 */

/** Type guard: value is a finite number (excludes NaN, ±Infinity). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Type guard: value is an integer (number and integer). */
export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

/**
 * Clamp value between min and max (inclusive).
 * NaN in any argument returns NaN. Throws RangeError if min > max
 * (TC39 Math.clamp semantics).
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value) || Number.isNaN(min) || Number.isNaN(max)) {
    return Number.NaN;
  }
  if (min > max) {
    throw new RangeError(`clamp: min (${min}) must be <= max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}

export type RoundToOptions = {
  /**
   * Tie-breaking mode for values exactly halfway between neighbours.
   * "half-up" (default, matches Math.round): ties round toward +Infinity.
   * "half-even" (banker's rounding): ties round to the nearest even digit.
   */
  mode?: "half-up" | "half-even";
};

const MAX_ROUND_DECIMALS = 292; // beyond this 10**d is not representable

/** Round a half-way-broken shifted value; assumes integer-boundary rounding. */
function roundShifted(n: number, mode: "half-up" | "half-even"): number {
  const r = Math.round(n);
  if (mode === "half-even" && Math.abs(n % 1) === 0.5 && r % 2 !== 0) {
    // Math.round sends ties toward +Infinity, so the even neighbour is r - 1.
    return r - 1;
  }
  return r;
}

/** Shift the decimal exponent of a finite number by `by` places, exactly. */
function shiftDecimal(value: number, by: number): number {
  const [mantissa, exponent = "0"] = `${value}e`.split("e");
  return Number(`${mantissa}e${Number(exponent) + by}`);
}

/**
 * Round value to given decimal places (negative decimals round to tens,
 * hundreds, ...). Uses exponent-shift rounding so decimal inputs round the
 * way they read (roundTo(1.005, 2) === 1.01), unlike the multiply-divide
 * idiom which yields 1 due to float representation error.
 */
export function roundTo(value: number, decimals: number, options: RoundToOptions = {}): number {
  if (!Number.isFinite(value)) return value;
  const mode = options.mode ?? "half-up";
  const places = Math.min(Math.max(Math.floor(decimals), -MAX_ROUND_DECIMALS), MAX_ROUND_DECIMALS);
  if (Number.isNaN(places)) return Number.NaN;

  // Fast path: for common precisions, multiply-shift and only fall back to
  // the exact decimal-string shift when the shifted value lands near a tie
  // (where float representation error could flip the rounding direction).
  if (places >= 0 && places <= 15) {
    const factor = 10 ** places; // exact for 10^0..10^22
    const shifted = value * factor;
    if (Math.abs(shifted) < 2 ** 52) {
      const frac = shifted - Math.floor(shifted);
      const tieDistance = Math.abs(frac - 0.5);
      const uncertainty = 4 * Number.EPSILON * Math.abs(shifted) + Number.EPSILON;
      if (tieDistance > uncertainty) {
        return Math.round(shifted) / factor; // provably tie-free: exact round
      }
    }
  }

  const shifted = shiftDecimal(value, places);
  if (!Number.isFinite(shifted)) return value; // shift out of range: identity
  const result = shiftDecimal(roundShifted(shifted, mode), -places);
  // Math.round(-0.4) === -0; the decimal-string shift drops the sign.
  return result === 0 && (value < 0 || Object.is(value, -0)) ? -0 : result;
}

/**
 * Coerce a value to a number for parsing purposes.
 * Returns NaN for values that are not numbers, exact bigints, or non-empty
 * numeric strings — so "", null, [], booleans and objects hit the fallback
 * instead of silently coercing to 0/1 via Number().
 */
function coerceNumeric(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") {
    const n = Number(value);
    // Reject bigints that cannot round-trip (silent precision loss).
    return Number.isFinite(n) && BigInt(n) === value ? n : Number.NaN;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? Number.NaN : Number(trimmed);
  }
  return Number.NaN;
}

/**
 * Parse to integer (truncated toward zero, like parseInt/lodash.toInteger);
 * returns fallback for NaN/invalid. Accepts numbers, numeric strings, and
 * bigints that fit exactly. "", null, arrays, and booleans are invalid.
 */
export function toInt(value: unknown, fallback?: number): number {
  const n = coerceNumeric(value);
  if (!Number.isFinite(n)) return fallback ?? 0;
  return Math.trunc(n);
}

/**
 * Parse to float; returns fallback for NaN/invalid. Accepts numbers, numeric
 * strings, and bigints that fit exactly. "", null, arrays, and booleans are
 * invalid.
 */
export function toFloat(value: unknown, fallback?: number): number {
  const n = coerceNumeric(value);
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

/**
 * Random integer in [min, max] inclusive (Math.random — NOT for security;
 * use crypto.utils randomIntSecure for that). Throws TypeError on non-finite
 * bounds and RangeError when the range contains no integers or is too large
 * for exact results.
 */
export function randomInt(min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new TypeError(`randomInt: bounds must be finite (got ${min}, ${max})`);
  }
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (lo > hi) {
    throw new RangeError(`randomInt: no integers in [${min}, ${max}]`);
  }
  const range = hi - lo + 1;
  if (range > Number.MAX_SAFE_INTEGER) {
    throw new RangeError("randomInt: range exceeds MAX_SAFE_INTEGER");
  }
  return Math.floor(Math.random() * range) + lo;
}

/**
 * Linear interpolation between a and b by t.
 * C++20 std::lerp semantics (P0811R3): exact at t=0 and t=1, monotonic,
 * bounded for t in [0,1], consistent (lerp(a, a, t) === a).
 */
export function lerp(a: number, b: number, t: number): number {
  if ((a <= 0 && b >= 0) || (a >= 0 && b <= 0)) {
    return t * b + (1 - t) * a;
  }
  if (t === 1) return b;
  const x = a + t * (b - a);
  return t > 1 === b > a ? Math.max(b, x) : Math.min(b, x);
}

/**
 * Inverse of lerp: the t for which lerp(a, b, t) === value (approximately).
 * Returns 0 when a === b (Unity Mathf.InverseLerp convention).
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

/**
 * Remap value from [inLow, inHigh] to [outLow, outHigh]
 * (Math.scale in the TC39 math-extensions proposal). Does not clamp;
 * compose with clamp() if needed.
 */
export function remap(
  value: number,
  inLow: number,
  inHigh: number,
  outLow: number,
  outHigh: number,
): number {
  return lerp(outLow, outHigh, inverseLerp(inLow, inHigh, value));
}

export type ApproxEqualOptions = {
  /** Relative tolerance (default 1e-9). */
  relTol?: number;
  /** Absolute tolerance for comparisons near zero (default 0). */
  absTol?: number;
};

/**
 * Float-safe equality (PEP 485 math.isclose semantics):
 * |a-b| <= max(relTol * max(|a|,|b|), absTol). NaN is never close to
 * anything; infinities are only close to themselves.
 */
export function approxEqual(a: number, b: number, options: ApproxEqualOptions = {}): boolean {
  const relTol = options.relTol ?? 1e-9;
  const absTol = options.absTol ?? 0;
  if (relTol < 0 || absTol < 0) {
    throw new RangeError("approxEqual: tolerances must be non-negative");
  }
  if (a === b) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const diff = Math.abs(a - b);
  return diff <= Math.max(relTol * Math.max(Math.abs(a), Math.abs(b)), absTol);
}

/**
 * Sum of numbers using Neumaier compensated summation: same O(n) cost as
 * reduce, but the running error is carried in a compensation term, so
 * sum(Array(10).fill(0.1)) === 1 and sum([1e100, 1, -1e100]) === 1
 * (naive reduce yields 0.9999999999999999 and 0).
 */
export function sum(values: number[]): number {
  let s = 0;
  let c = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const t = s + v;
    c += Math.abs(s) >= Math.abs(v) ? s - t + v : v - t + s;
    s = t;
  }
  // Standard Kahan-Babuska-Neumaier finalisation. On a non-finite running total the
  // compensation term is NaN (Infinity - Infinity), so adding it turned a correct Infinity
  // into NaN - making this *less* accurate than a naive reduce on exactly the inputs the
  // docstring claims it handles better.
  return Number.isFinite(s) ? s + c : s;
}

type MathWithSumPrecise = Math & {
  sumPrecise?: (values: Iterable<number>) => number;
};

/**
 * Correctly rounded sum of an iterable of numbers (ES2026 Math.sumPrecise
 * semantics: rejects non-number values with TypeError, returns -0 for an
 * empty iterable). Uses the native implementation when the runtime has one;
 * otherwise falls back to Shewchuk non-overlapping partials (Python
 * math.fsum), which is exact up to final rounding.
 */
export function sumPrecise(values: Iterable<number>): number {
  const native = (Math as MathWithSumPrecise).sumPrecise;
  if (typeof native === "function") return native.call(Math, values);

  const partials: number[] = [];
  let zeroAcc = -0; // preserves sign: -0 + 0 === +0, -0 + -0 === -0
  let infSign = 0;
  let sawNaN = false;

  for (let x of values) {
    if (typeof x !== "number") {
      throw new TypeError("sumPrecise: all values must be numbers");
    }
    if (Number.isNaN(x)) {
      sawNaN = true;
      continue;
    }
    if (!Number.isFinite(x)) {
      const s = x > 0 ? 1 : -1;
      if (infSign !== 0 && s !== infSign) sawNaN = true; // Inf + -Inf
      infSign = s;
      continue;
    }
    if (x === 0) {
      zeroAcc += x;
      continue;
    }
    let i = 0;
    for (let j = 0; j < partials.length; j++) {
      let y = partials[j];
      if (Math.abs(x) < Math.abs(y)) {
        const tmp = x;
        x = y;
        y = tmp;
      }
      const hi = x + y;
      const lo = y - (hi - x);
      if (lo !== 0) partials[i++] = lo;
      x = hi;
    }
    partials.length = i;
    if (!Number.isFinite(x)) {
      // exact running sum overflowed a double
      partials.length = 0;
      infSign = x > 0 ? 1 : -1;
      continue;
    }
    partials.push(x);
  }

  if (sawNaN) return Number.NaN;
  if (infSign !== 0) return infSign * Number.POSITIVE_INFINITY;
  let n = partials.length;
  if (n === 0) return zeroAcc;

  // Python fsum final-rounding: fold partials from largest down, applying a
  // half-way correction so the result is correctly rounded.
  let hi = partials[--n];
  let lo = 0;
  while (n > 0) {
    const x = hi;
    const y = partials[--n];
    hi = x + y;
    lo = y - (hi - x);
    if (lo !== 0) break;
  }
  if (n > 0 && ((lo < 0 && partials[n - 1] < 0) || (lo > 0 && partials[n - 1] > 0))) {
    const y = lo * 2;
    const x = hi + y;
    if (y === x - hi) hi = x;
  }
  return hi;
}

/** Average of numbers; 0 for empty array. */
export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}
