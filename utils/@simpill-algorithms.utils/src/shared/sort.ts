/** mergeSort (stable) and quickSort; both return new array. Comparator (a,b) => neg/0/pos. */
export type CompareFn<T> = (a: T, b: T) => number;

/** Below this size, insertion sort beats the recursive sorts (cache-friendly, low overhead). */
const SMALL_ARRAY_CUTOFF = 24;

/** In-place insertion sort on arr[lo..hi] inclusive. Stable. */
const insertionSortRange = <T>(arr: T[], lo: number, hi: number, compare: CompareFn<T>): void => {
  for (let i = lo + 1; i <= hi; i++) {
    const value = arr[i] as T;
    let j = i - 1;
    while (j >= lo && compare(arr[j] as T, value) > 0) {
      arr[j + 1] = arr[j] as T;
      j--;
    }
    arr[j + 1] = value;
  }
};

/** Recursive merge into `arr` using a single shared auxiliary buffer. Stable. */
const mergeSortRange = <T>(
  arr: T[],
  aux: T[],
  lo: number,
  hi: number,
  compare: CompareFn<T>,
): void => {
  if (hi - lo < SMALL_ARRAY_CUTOFF) {
    insertionSortRange(arr, lo, hi, compare);
    return;
  }
  const mid = lo + ((hi - lo) >>> 1);
  mergeSortRange(arr, aux, lo, mid, compare);
  mergeSortRange(arr, aux, mid + 1, hi, compare);
  // Adaptive: halves already in order -> no merge needed (sorted input becomes ~O(n)).
  if (compare(arr[mid] as T, arr[mid + 1] as T) <= 0) return;
  for (let k = lo; k <= hi; k++) aux[k] = arr[k] as T;
  let i = lo;
  let j = mid + 1;
  for (let k = lo; k <= hi; k++) {
    if (i > mid) {
      arr[k] = aux[j++] as T;
    } else if (j > hi) {
      arr[k] = aux[i++] as T;
    } else if (compare(aux[j] as T, aux[i] as T) < 0) {
      arr[k] = aux[j++] as T;
    } else {
      arr[k] = aux[i++] as T;
    }
  }
};

/**
 * Stable O(n log n) merge sort; returns new array.
 * Single auxiliary buffer (no per-level slice allocations), insertion sort for
 * small ranges, and an adaptive skip when halves are already ordered.
 */
export function mergeSort<T>(array: T[], compare: CompareFn<T>): T[] {
  const arr = array.slice();
  if (arr.length <= 1) return arr;
  const aux: T[] = new Array(arr.length);
  mergeSortRange(arr, aux, 0, arr.length - 1, compare);
  return arr;
}

/** Median-of-three: order arr[lo], arr[mid], arr[hi] and return the median value. */
const medianOfThree = <T>(
  arr: T[],
  lo: number,
  mid: number,
  hi: number,
  compare: CompareFn<T>,
): T => {
  const a = arr[lo] as T;
  const b = arr[mid] as T;
  const c = arr[hi] as T;
  if (compare(a, b) > 0) {
    if (compare(b, c) > 0) return b;
    return compare(a, c) > 0 ? c : a;
  }
  if (compare(a, c) > 0) return a;
  return compare(b, c) > 0 ? c : b;
};

/** Detect fully ascending input (O(n)); pdqsort/TimSort-style run detection. */
const isAscending = <T>(arr: T[], compare: CompareFn<T>): boolean => {
  for (let i = 1; i < arr.length; i++) {
    if (compare(arr[i - 1] as T, arr[i] as T) > 0) return false;
  }
  return true;
};

/** Detect strictly descending input (O(n)); reversing it yields a sorted array. */
const isStrictlyDescending = <T>(arr: T[], compare: CompareFn<T>): boolean => {
  for (let i = 1; i < arr.length; i++) {
    if (compare(arr[i - 1] as T, arr[i] as T) <= 0) return false;
  }
  return true;
};

/**
 * Quick sort (not stable); returns new array.
 * Median-of-three pivot + fat (three-way) partition + recursion only on the
 * smaller side, so sorted, reverse-sorted, and all-equal inputs run in
 * O(n log n) (already-sorted and all-equal in O(n) via run detection) with
 * O(log n) stack depth — the previous Lomuto last-element-pivot version was
 * O(n^2) on those inputs and overflowed the call stack at ~10k elements.
 */
export function quickSort<T>(array: T[], compare: CompareFn<T>): T[] {
  const arr = array.slice();
  if (arr.length <= 1) return arr;
  // pdqsort-style cheap guards: O(n) pass turns the two most common
  // "adversarial" real-world shapes into O(n) total.
  if (isAscending(arr, compare)) return arr;
  if (isStrictlyDescending(arr, compare)) {
    arr.reverse();
    return arr;
  }

  const qs = (start: number, end: number): void => {
    let lo = start;
    let hi = end;
    while (hi - lo >= SMALL_ARRAY_CUTOFF) {
      const pivot = medianOfThree(arr, lo, lo + ((hi - lo) >>> 1), hi, compare);
      // Dutch national flag: [lo..lt-1] < pivot, [lt..gt] == pivot, [gt+1..hi] > pivot.
      let lt = lo;
      let gt = hi;
      let i = lo;
      while (i <= gt) {
        const c = compare(arr[i] as T, pivot);
        if (c < 0) {
          const tmp = arr[lt] as T;
          arr[lt] = arr[i] as T;
          arr[i] = tmp;
          lt++;
          i++;
        } else if (c > 0) {
          const tmp = arr[gt] as T;
          arr[gt] = arr[i] as T;
          arr[i] = tmp;
          gt--;
        } else {
          i++;
        }
      }
      // Recurse on the smaller partition, loop on the larger: stack stays O(log n).
      if (lt - lo < hi - gt) {
        qs(lo, lt - 1);
        lo = gt + 1;
      } else {
        qs(gt + 1, hi);
        hi = lt - 1;
      }
    }
    insertionSortRange(arr, lo, hi, compare);
  };

  qs(0, arr.length - 1);
  return arr;
}

/** True if the array is sorted (non-decreasing) under the comparator. O(n). */
export function isSorted<T>(array: T[], compare: CompareFn<T>): boolean {
  for (let i = 1; i < array.length; i++) {
    if (compare(array[i - 1] as T, array[i] as T) > 0) return false;
  }
  return true;
}
