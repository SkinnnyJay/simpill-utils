import { ERROR_SEARCH_CIRCULAR_REFERENCE } from "./constants";

/**
 * Search utilities: string search with selectable algorithms, object walk with max depth.
 */

/** String search algorithm. */
export enum StringSearchAlgorithm {
  /** Native String#indexOf. */
  IndexOf = "indexOf",
  /** Native String#includes. */
  Includes = "includes",
  /** Knuth–Morris–Pratt. */
  Kmp = "kmp",
}

/**
 * KMP failure table for pattern.
 */
function buildKmpTable(pattern: string): number[] {
  const len = pattern.length;
  const table = new Array<number>(len);
  table[0] = 0;
  let i = 1;
  let j = 0;
  while (i < len) {
    if (pattern[i] === pattern[j]) {
      j++;
      table[i] = j;
      i++;
    } else if (j > 0) {
      j = table[j - 1];
    } else {
      table[i] = 0;
      i++;
    }
  }
  return table;
}

/**
 * KMP search: returns first index of pattern in text, or -1.
 */
function kmpSearch(text: string, pattern: string): number {
  if (pattern.length === 0) return 0;
  if (text.length < pattern.length) return -1;
  const table = buildKmpTable(pattern);
  let i = 0;
  let j = 0;
  while (i < text.length) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
      if (j === pattern.length) return i - j;
    } else if (j > 0) {
      j = table[j - 1];
    } else {
      i++;
    }
  }
  return -1;
}

/**
 * Search for needle in haystack using the given algorithm.
 * Returns the first index of needle, or -1 if not found.
 * (Includes previously scanned the string twice — includes() to test, then
 * indexOf() to locate; a single indexOf() is observably identical.)
 */
export function searchString(
  haystack: string,
  needle: string,
  algorithm: StringSearchAlgorithm = StringSearchAlgorithm.Includes,
): number {
  switch (algorithm) {
    case StringSearchAlgorithm.IndexOf:
    case StringSearchAlgorithm.Includes:
      return haystack.indexOf(needle);
    case StringSearchAlgorithm.Kmp:
      return kmpSearch(haystack, needle);
    default: {
      const _: never = algorithm;
      return haystack.indexOf(needle);
    }
  }
}

/** Options for searchStringAll. */
export interface SearchStringAllOptions {
  /** Algorithm to use (default: Includes / native indexOf loop). */
  algorithm?: StringSearchAlgorithm;
  /**
   * Include overlapping matches (default false). With overlapping,
   * "aaaa"/"aa" matches at 0, 1 and 2; without, at 0 and 2.
   */
  overlapping?: boolean;
}

/**
 * All match indices of needle in haystack, in ascending order. An empty
 * needle returns [] (an indexOf loop over an empty pattern never advances).
 * The KMP variant builds the failure table once and scans in a single pass.
 */
export function searchStringAll(
  haystack: string,
  needle: string,
  options: SearchStringAllOptions = {},
): number[] {
  const { algorithm = StringSearchAlgorithm.Includes, overlapping = false } = options;
  const out: number[] = [];
  if (needle.length === 0) return out;

  if (algorithm === StringSearchAlgorithm.Kmp) {
    const table = buildKmpTable(needle);
    let i = 0;
    let j = 0;
    while (i < haystack.length) {
      if (haystack[i] === needle[j]) {
        i++;
        j++;
        if (j === needle.length) {
          out.push(i - j);
          j = overlapping ? table[j - 1] : 0;
        }
      } else if (j > 0) {
        j = table[j - 1];
      } else {
        i++;
      }
    }
    return out;
  }

  let from = 0;
  while (from <= haystack.length - needle.length) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    out.push(idx);
    from = overlapping ? idx + 1 : idx + needle.length;
  }
  return out;
}

/** One match from object search: path (e.g. "a.b.0") and value. */
export interface ObjectSearchMatch {
  path: string;
  value: unknown;
}

/** Options for searchObject. */
export interface SearchObjectOptions {
  /** Maximum depth to descend (default: Infinity). */
  maxDepth?: number;
  /** Predicate(path, key, value) – if true, node is included in results. */
  predicate?: (path: string, key: string, value: unknown) => boolean;
  /**
   * Circular-reference handling (default "skip": the repeated ancestor is not
   * re-descended). The previous implementation crashed with RangeError.
   */
  onCycle?: "skip" | "throw";
}

interface WalkFrame {
  value: unknown;
  path: string;
  key: string;
  depth: number;
  /** When set, this frame pops the object off the ancestor set instead of visiting. */
  exit?: object;
}

/**
 * Walks an object/array to max depth and returns matching nodes with path and value.
 * Path uses dot notation; array indices are numbers (e.g. "items.0.name").
 * Root is visited with path ""; results normalize it to ".".
 * Without predicate, only leaf values (primitives/null) are returned.
 *
 * Iterative with an explicit stack (the recursive original overflowed on
 * ~10k-deep trees) and cycle-safe via ancestor tracking, so shared non-cyclic
 * sub-objects are still visited once per path exactly like before. The
 * predicate now receives the real key — the original derived it by splitting
 * the path on ".", which reported the wrong key for property names containing
 * dots.
 */
export function searchObject(obj: unknown, options: SearchObjectOptions = {}): ObjectSearchMatch[] {
  const { maxDepth = Infinity, predicate, onCycle = "skip" } = options;
  const results: ObjectSearchMatch[] = [];
  const ancestors = new Set<object>();
  const stack: WalkFrame[] = [{ value: obj, path: "", key: "", depth: 0 }];

  while (stack.length > 0) {
    const frame = stack.pop();
    if (frame === undefined) break;
    if (frame.exit !== undefined) {
      ancestors.delete(frame.exit);
      continue;
    }
    const { value, path, key, depth } = frame;
    if (depth > maxDepth) continue;

    if (value === null || typeof value !== "object") {
      if (!predicate || predicate(path, key, value)) {
        results.push({ path: path === "" ? "." : path, value });
      }
      continue;
    }

    const node = value as object;
    if (ancestors.has(node)) {
      if (onCycle === "throw") {
        throw new Error(ERROR_SEARCH_CIRCULAR_REFERENCE);
      }
      continue;
    }
    if (predicate?.(path, key, value)) {
      results.push({ path: path === "" ? "." : path, value });
    }
    ancestors.add(node);
    stack.push({ value: null, path: "", key: "", depth: 0, exit: node });

    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        const childKey = String(i);
        stack.push({
          value: node[i],
          path: path ? `${path}.${childKey}` : childKey,
          key: childKey,
          depth: depth + 1,
        });
      }
    } else {
      const keys = Object.keys(node);
      const record = node as Record<string, unknown>;
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i];
        stack.push({
          value: record[k],
          path: path ? `${path}.${k}` : k,
          key: k,
          depth: depth + 1,
        });
      }
    }
  }
  return results;
}
