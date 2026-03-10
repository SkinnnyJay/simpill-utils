import { VALUE_0, VALUE_1 } from "./constants";

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
  table[VALUE_0] = VALUE_0;
  let i = VALUE_1;
  let j = VALUE_0;
  while (i < len) {
    if (pattern[i] === pattern[j]) {
      j++;
      table[i] = j;
      i++;
    } else if (j > VALUE_0) {
      j = table[j - VALUE_1];
    } else {
      table[i] = VALUE_0;
      i++;
    }
  }
  return table;
}

/**
 * KMP search: returns first index of pattern in text, or -1.
 */
function kmpSearch(text: string, pattern: string): number {
  if (pattern.length === VALUE_0) return VALUE_0;
  if (text.length < pattern.length) return -1;
  const table = buildKmpTable(pattern);
  let i = VALUE_0;
  let j = VALUE_0;
  while (i < text.length) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
      if (j === pattern.length) return i - j;
    } else if (j > VALUE_0) {
      j = table[j - VALUE_1];
    } else {
      i++;
    }
  }
  return -1;
}

/**
 * Search for needle in haystack using the given algorithm.
 * Returns the first index of needle, or -1 if not found.
 */
export function searchString(
  haystack: string,
  needle: string,
  algorithm: StringSearchAlgorithm = StringSearchAlgorithm.Includes,
): number {
  switch (algorithm) {
    case StringSearchAlgorithm.IndexOf:
      return haystack.indexOf(needle);
    case StringSearchAlgorithm.Includes:
      return haystack.includes(needle) ? haystack.indexOf(needle) : -1;
    case StringSearchAlgorithm.Kmp:
      return kmpSearch(haystack, needle);
    default: {
      const _: never = algorithm;
      return haystack.indexOf(needle);
    }
  }
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
}

/**
 * Walks an object/array to max depth and returns matching nodes with path and value.
 * Path uses dot notation; array indices are numbers (e.g. "items.0.name").
 * Root is visited with path ""; pathParts normalizes it to "." in results.
 * Without predicate, only leaf values (primitives/null) are returned.
 */
export function searchObject(obj: unknown, options: SearchObjectOptions = {}): ObjectSearchMatch[] {
  const { maxDepth = Infinity, predicate } = options;
  const results: ObjectSearchMatch[] = [];
  const pathParts = (p: string): string => (p ? p : ".");

  function walk(value: unknown, path: string, depth: number): void {
    if (depth > maxDepth) return;
    const key = path.split(".").pop() ?? "";
    const isLeaf = value === null || typeof value !== "object";

    if (isLeaf) {
      if (!predicate || predicate(path, key, value)) {
        results.push({ path: pathParts(path), value });
      }
      return;
    }
    if (predicate && predicate(path, key, value)) {
      results.push({ path: pathParts(path), value });
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        walk(value[i], path ? `${path}.${i}` : String(i), depth + 1);
      }
      return;
    }
    const record = value as Record<string, unknown>;
    for (const k of Object.keys(record)) {
      walk(record[k], path ? `${path}.${k}` : k, depth + 1);
    }
  }

  walk(obj, "", 0);
  return results;
}
