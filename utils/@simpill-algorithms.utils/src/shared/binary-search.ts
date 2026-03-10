/** Binary search and bounds on sorted arrays; comparator (a,b) => neg/0/pos. */
import type { CompareFn } from "./sort";

/** Find index of value in sorted array, or -1 if not found. */
export function binarySearch<T>(array: T[], value: T, compare: CompareFn<T>): number {
  let lo = 0;
  let hi = array.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const c = compare(array[mid], value);
    if (c === 0) return mid;
    if (c < 0) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

/** First index where array[i] >= value (lower bound). */
export function lowerBound<T>(array: T[], value: T, compare: CompareFn<T>): number {
  let lo = 0;
  let hi = array.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compare(array[mid], value) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** First index where array[i] > value (upper bound). */
export function upperBound<T>(array: T[], value: T, compare: CompareFn<T>): number {
  let lo = 0;
  let hi = array.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compare(array[mid], value) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
