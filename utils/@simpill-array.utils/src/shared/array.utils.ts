/** Array helpers: guards, unique, chunk, compact, groupBy, sortBy, partition, etc. */
/** Type guard: value is a non-empty array. */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/** Type guard: value is an array (possibly empty). */
export function isArrayLike<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/** Dedupe by reference; preserves first occurrence. */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/** Dedupe by key; preserves first occurrence per key. */
export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/** Split array into chunks of size. */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/** Remove null and undefined from array. */
export function compact<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((x): x is T => x !== null && x !== undefined);
}

/** Flatten one level. */
export function flattenOnce<T>(array: ReadonlyArray<T | T[]>): T[] {
  const result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) result.push(...item);
    else result.push(item);
  }
  return result;
}

/** Group by key; returns Map<K, T[]>. */
export function groupBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export type SortOrder = "asc" | "desc";

/** Sort by key; returns new array. */
export function sortBy<T, K>(array: T[], keyFn: (item: T) => K, order: SortOrder = "asc"): T[] {
  const cmp =
    order === "desc"
      ? (a: K, b: K) => (a < b ? 1 : a > b ? -1 : 0)
      : (a: K, b: K) => (a < b ? -1 : a > b ? 1 : 0);
  return [...array].sort((x, y) => cmp(keyFn(x), keyFn(y)));
}

/** Split array into [matches, rest] by predicate. */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const left: T[] = [];
  const right: T[] = [];
  for (const item of array) {
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
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/** Last element or undefined if empty. */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/** First n elements. */
export function take<T>(array: T[], n: number): T[] {
  if (n <= 0) return [];
  return array.slice(0, n);
}

/** Skip first n elements. */
export function drop<T>(array: T[], n: number): T[] {
  if (n <= 0) return array.slice();
  return array.slice(n);
}

/** Last n elements. */
export function takeRight<T>(array: T[], n: number): T[] {
  if (n <= 0) return [];
  return array.slice(-n);
}

/** Skip last n elements. */
export function dropRight<T>(array: T[], n: number): T[] {
  if (n <= 0) return array.slice();
  return array.slice(0, -n);
}

/** Zip two arrays into pairs; length = min(a.length, b.length). */
export function zip<A, B>(a: A[], b: B[]): [A, B][] {
  const len = Math.min(a.length, b.length);
  const result: [A, B][] = [];
  for (let i = 0; i < len; i++) result.push([a[i], b[i]]);
  return result;
}

/** Unzip pairs into [as, bs]. */
export function unzip<A, B>(pairs: [A, B][]): [A[], B[]] {
  const as: A[] = [];
  const bs: B[] = [];
  for (const [x, y] of pairs) {
    as.push(x);
    bs.push(y);
  }
  return [as, bs];
}

/** Build map key -> first occurrence; use when keys are unique. */
export function keyBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of array) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return map;
}

/** Count occurrences by key. */
export function countBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, number> {
  const map = new Map<K, number>();
  for (const item of array) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/** Elements in both arrays (Set equality). */
export function intersection<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

/** Elements in a not in b (Set equality). */
export function difference<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter((x) => !set.has(x));
}

/** All unique elements from both arrays. */
export function union<T>(a: T[], b: T[]): T[] {
  return unique([...a, ...b]);
}

/** One random element or undefined if empty. */
export function sample<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/** Fisher–Yates shuffle; returns new array. */
export function shuffle<T>(array: T[]): T[] {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
