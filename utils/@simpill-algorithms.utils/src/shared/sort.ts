/** mergeSort (stable) and quickSort; both return new array. Comparator (a,b) => neg/0/pos. */
export type CompareFn<T> = (a: T, b: T) => number;

/** Stable O(n log n) merge sort; returns new array. */
export function mergeSort<T>(array: T[], compare: CompareFn<T>): T[] {
  const n = array.length;
  if (n <= 1) return array.slice();
  const mid = Math.floor(n / 2);
  const left = mergeSort(array.slice(0, mid), compare);
  const right = mergeSort(array.slice(mid), compare);
  const out: T[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (compare(left[i], right[j]) <= 0) {
      out.push(left[i]);
      i++;
    } else {
      out.push(right[j]);
      j++;
    }
  }
  while (i < left.length) {
    out.push(left[i]);
    i++;
  }
  while (j < right.length) {
    out.push(right[j]);
    j++;
  }
  return out;
}

/** Quick sort (not stable); returns new array. */
export function quickSort<T>(array: T[], compare: CompareFn<T>): T[] {
  const arr = array.slice();
  function qs(lo: number, hi: number): void {
    if (lo >= hi) return;
    const pivot = arr[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (compare(arr[j], pivot) <= 0) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    i++;
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    qs(lo, i - 1);
    qs(i + 1, hi);
  }
  qs(0, arr.length - 1);
  return arr;
}
