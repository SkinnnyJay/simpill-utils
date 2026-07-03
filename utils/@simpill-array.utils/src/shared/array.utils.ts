/** Array helpers: guards, unique, chunk, compact, groupBy, sortBy, partition, etc. */
/** Type guard: value is a non-empty array. */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/** Type guard: value is an array (possibly empty). */
export function isArrayLike<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/** Dedupe by SameValueZero equality; preserves first occurrence. Accepts any iterable. */
export function unique<T>(iterable: Iterable<T>): T[] {
  return [...new Set(iterable)];
}

/** Dedupe by key; preserves first occurrence per key. Accepts any iterable. */
export function uniqueBy<T, K>(iterable: Iterable<T>, keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of iterable) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Split array into chunks of size. Non-integer sizes are floored so every
 * chunk (except the last) has the same length; NaN or sizes < 1 return [].
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  const step = Math.floor(size);
  if (Number.isNaN(step) || step < 1) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += step) {
    result.push(array.slice(i, i + step));
  }
  return result;
}

/** Remove null and undefined. Accepts any iterable. */
export function compact<T>(iterable: Iterable<T | null | undefined>): T[] {
  const result: T[] = [];
  for (const item of iterable) {
    if (item !== null && item !== undefined) result.push(item);
  }
  return result;
}

/**
 * Flatten one level. Accepts any iterable. Safe for inner arrays of any
 * length: unconditional spread into push() throws RangeError past the
 * engine's argument limit (~65-125k elements in V8).
 */
export function flattenOnce<T>(iterable: Iterable<T | readonly T[]>): T[] {
  const result: T[] = [];
  for (const item of iterable) {
    if (Array.isArray(item)) {
      // spread is fastest but limited by the engine's max argument count;
      // fall back to a plain loop for large inner arrays instead of throwing.
      if (item.length <= 32768) result.push(...item);
      else for (let i = 0; i < item.length; i++) result.push(item[i]);
    } else {
      result.push(item as T);
    }
  }
  return result;
}

/** Group by key; returns Map<K, T[]>. Accepts any iterable. */
export function groupBy<T, K>(iterable: Iterable<T>, keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of iterable) {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export type SortOrder = "asc" | "desc";

/** null, undefined and NaN keys always sort last, regardless of order. */
function compareKeys(a: unknown, b: unknown, desc: boolean): number {
  // biome-ignore lint/suspicious/noSelfCompare: NaN check without Number.isNaN (keys may be non-numbers)
  const aMissing = a === null || a === undefined || a !== a;
  // biome-ignore lint/suspicious/noSelfCompare: see above
  const bMissing = b === null || b === undefined || b !== b;
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  if (a === b) return 0;
  const lt = (a as never) < (b as never);
  const gt = (a as never) > (b as never);
  if (!lt && !gt) return 0;
  const cmp = lt ? -1 : 1;
  return desc ? -cmp : cmp;
}

/**
 * Sort by one key function or several (ties broken by the next key).
 * Stable; returns a new array. Each key function is called exactly once per
 * element (decorate-sort-undecorate), not once per comparison.
 * null/undefined/NaN keys deterministically sort last in either order.
 */
export function sortBy<T, K>(array: readonly T[], keyFn: (item: T) => K, order?: SortOrder): T[];
export function sortBy<T>(
  array: readonly T[],
  keyFns: ReadonlyArray<(item: T) => unknown>,
  order?: SortOrder,
): T[];
export function sortBy<T>(
  array: readonly T[],
  keyFn: ((item: T) => unknown) | ReadonlyArray<(item: T) => unknown>,
  order: SortOrder = "asc",
): T[] {
  const keyFns = Array.isArray(keyFn) ? keyFn : [keyFn];
  const desc = order === "desc";
  const n = array.length;
  const m = keyFns.length;
  // one flat key column per key function — each keyFn runs exactly once per element
  const cols: unknown[][] = new Array(m);
  for (let k = 0; k < m; k++) {
    const fn = keyFns[k];
    const col: unknown[] = new Array(n);
    for (let i = 0; i < n; i++) col[i] = fn(array[i]);
    cols[k] = col;
  }
  const idx: number[] = new Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  // index tie-break makes stability a guarantee, not an engine property
  idx.sort((i, j) => {
    for (let k = 0; k < m; k++) {
      const c = compareKeys(cols[k][i], cols[k][j], desc);
      if (c !== 0) return c;
    }
    return i - j;
  });
  const out: T[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = array[idx[i]];
  return out;
}

/** Split into [matches, rest] by predicate. Accepts any iterable. */
export function partition<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): [T[], T[]] {
  const left: T[] = [];
  const right: T[] = [];
  for (const item of iterable) {
    if (predicate(item)) left.push(item);
    else right.push(item);
  }
  return [left, right];
}

/** Ensure value is an array; wrap single item in array. */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** First element or undefined if empty. */
export function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

/** Last element or undefined if empty. */
export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}

/** First n elements. */
export function take<T>(array: readonly T[], n: number): T[] {
  if (n <= 0) return [];
  return array.slice(0, n);
}

/** Skip first n elements. */
export function drop<T>(array: readonly T[], n: number): T[] {
  if (n <= 0) return array.slice();
  return array.slice(n);
}

/** Last n elements. */
export function takeRight<T>(array: readonly T[], n: number): T[] {
  if (n <= 0) return [];
  return array.slice(-n);
}

/** Skip last n elements. */
export function dropRight<T>(array: readonly T[], n: number): T[] {
  if (n <= 0) return array.slice();
  return array.slice(0, -n);
}

/** Zip two arrays into pairs; length = min(a.length, b.length). */
export function zip<A, B>(a: readonly A[], b: readonly B[]): [A, B][] {
  const len = Math.min(a.length, b.length);
  const result: [A, B][] = new Array(len);
  for (let i = 0; i < len; i++) result[i] = [a[i], b[i]];
  return result;
}

/** Zip two arrays through a combiner; length = min(a.length, b.length). */
export function zipWith<A, B, R>(
  a: readonly A[],
  b: readonly B[],
  fn: (a: A, b: B, index: number) => R,
): R[] {
  const len = Math.min(a.length, b.length);
  const result: R[] = new Array(len);
  for (let i = 0; i < len; i++) result[i] = fn(a[i], b[i], i);
  return result;
}

/** Unzip pairs into [as, bs]. */
export function unzip<A, B>(pairs: ReadonlyArray<readonly [A, B]>): [A[], B[]] {
  const as: A[] = [];
  const bs: B[] = [];
  for (const [x, y] of pairs) {
    as.push(x);
    bs.push(y);
  }
  return [as, bs];
}

/** Build map key -> first occurrence; use when keys are unique. Accepts any iterable. */
export function keyBy<T, K>(iterable: Iterable<T>, keyFn: (item: T) => K): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of iterable) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return map;
}

/** Count occurrences by key. Accepts any iterable. */
export function countBy<T, K>(iterable: Iterable<T>, keyFn: (item: T) => K): Map<K, number> {
  const map = new Map<K, number>();
  for (const item of iterable) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/**
 * Unique elements present in both arrays (SameValueZero), in first-occurrence
 * order of `a`. Result never contains duplicates.
 */
export function intersection<T>(a: readonly T[], b: readonly T[]): T[] {
  const inB = new Set(b);
  const out: T[] = [];
  const seen = new Set<T>();
  for (const x of a) {
    if (inB.has(x) && !seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

/** Elements in a not in b (SameValueZero); duplicates in a are preserved. */
export function difference<T>(a: readonly T[], b: readonly T[]): T[] {
  const set = new Set(b);
  return a.filter((x) => !set.has(x));
}

/** All unique elements from both arrays, a-first order. */
export function union<T>(a: readonly T[], b: readonly T[]): T[] {
  const set = new Set(a);
  for (const x of b) set.add(x);
  return [...set];
}

/** Unique elements present in exactly one of the two arrays; a-first order. */
export function symmetricDifference<T>(a: readonly T[], b: readonly T[]): T[] {
  const setA = new Set(a);
  const setB = new Set(b);
  const out: T[] = [];
  for (const x of setA) if (!setB.has(x)) out.push(x);
  for (const x of setB) if (!setA.has(x)) out.push(x);
  return out;
}

/** One random element or undefined if empty. Optional rng in [0, 1) for determinism. */
export function sample<T>(array: readonly T[], rng: () => number = Math.random): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(rng() * array.length)];
}

/**
 * n distinct-position random elements (unbiased partial Fisher-Yates);
 * n is clamped to [0, length]. Optional rng in [0, 1) for determinism.
 */
export function sampleSize<T>(
  array: readonly T[],
  n: number,
  rng: () => number = Math.random,
): T[] {
  const len = array.length;
  const k = Math.min(Math.max(Math.floor(n), 0), len) || 0;
  if (k === 0) return [];
  const copy = array.slice();
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (len - i));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  copy.length = k;
  return copy;
}

/** Fisher-Yates shuffle; returns new array. Optional rng in [0, 1) for determinism. */
export function shuffle<T>(array: readonly T[], rng: () => number = Math.random): T[] {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Element with the smallest key; skips null/undefined/NaN keys; undefined if none. */
export function minBy<T>(
  iterable: Iterable<T>,
  keyFn: (item: T) => number | string,
): T | undefined {
  let best: T | undefined;
  let bestKey: number | string | undefined;
  for (const item of iterable) {
    const key = keyFn(item);
    // biome-ignore lint/suspicious/noSelfCompare: NaN check that also works for strings
    if (key === null || key === undefined || key !== key) continue;
    if (bestKey === undefined || key < bestKey) {
      best = item;
      bestKey = key;
    }
  }
  return best;
}

/** Element with the largest key; skips null/undefined/NaN keys; undefined if none. */
export function maxBy<T>(
  iterable: Iterable<T>,
  keyFn: (item: T) => number | string,
): T | undefined {
  let best: T | undefined;
  let bestKey: number | string | undefined;
  for (const item of iterable) {
    const key = keyFn(item);
    // biome-ignore lint/suspicious/noSelfCompare: NaN check that also works for strings
    if (key === null || key === undefined || key !== key) continue;
    if (bestKey === undefined || key > bestKey) {
      best = item;
      bestKey = key;
    }
  }
  return best;
}

/**
 * Sum of keyFn over the iterable using Neumaier compensated summation:
 * sumBy(Array(10).fill(0), () => 0.1) === 1 exactly, and
 * [1e100, 1, -1e100] sums to 1, not 0.
 */
export function sumBy<T>(iterable: Iterable<T>, keyFn: (item: T) => number): number {
  let sum = 0;
  let c = 0;
  for (const item of iterable) {
    const v = keyFn(item);
    const t = sum + v;
    if (Math.abs(sum) >= Math.abs(v)) c += sum - t + v;
    else c += v - t + sum;
    sum = t;
  }
  return sum + c;
}

/**
 * Numeric range. range(3) -> [0,1,2]; range(1, 4) -> [1,2,3];
 * range(4, 1) -> [4,3,2] (step defaults to -1 when end < start);
 * range(0, 10, 3) -> [0,3,6,9]. Throws RangeError on step 0 / NaN / Infinity.
 */
export function range(start: number, end?: number, step?: number): number[] {
  let lo = start;
  let hi = end;
  if (hi === undefined) {
    hi = lo;
    lo = 0;
  }
  const s = step !== undefined ? step : hi >= lo ? 1 : -1;
  if (s === 0 || !Number.isFinite(s)) throw new RangeError(`range: invalid step ${s}`);
  const len = Math.max(0, Math.ceil((hi - lo) / s));
  const out: number[] = new Array(len);
  for (let i = 0; i < len; i++) out[i] = lo + i * s;
  return out;
}

/**
 * Sliding windows of length size, advancing by step (default 1).
 * windowed([1,2,3,4], 2) -> [[1,2],[2,3],[3,4]]. Only full windows are
 * returned unless partialWindows is true. Non-integer size/step are floored;
 * size or step < 1 return [].
 */
export function windowed<T>(
  array: readonly T[],
  size: number,
  step = 1,
  partialWindows = false,
): T[][] {
  const w = Math.floor(size);
  const s = Math.floor(step);
  if (Number.isNaN(w) || Number.isNaN(s) || w < 1 || s < 1) return [];
  const out: T[][] = [];
  const limit = partialWindows ? array.length : array.length - w + 1;
  for (let i = 0; i < limit; i += s) {
    out.push(array.slice(i, i + w));
  }
  return out;
}
