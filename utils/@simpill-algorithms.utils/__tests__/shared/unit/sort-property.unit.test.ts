import { binarySearch, lowerBound, upperBound } from "../../../src/shared/binary-search";
import { isSorted, mergeSort, quickSort } from "../../../src/shared/sort";

const numCmp = (a: number, b: number) => a - b;

/** Deterministic LCG so property-test failures are reproducible. */
const makeRng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

describe("quickSort — pathological inputs no longer crash (Lumen uplift)", () => {
  const N = 100000;

  it("sorts a 100k already-sorted array (frozen ref: RangeError at 10k)", () => {
    const input = Array.from({ length: N }, (_, i) => i);
    expect(quickSort(input, numCmp)).toEqual(input);
  });

  it("sorts a 100k reverse-sorted array (frozen ref: RangeError at 10k)", () => {
    const input = Array.from({ length: N }, (_, i) => N - i);
    const result = quickSort(input, numCmp);
    expect(result[0]).toBe(1);
    expect(result[N - 1]).toBe(N);
    expect(isSorted(result, numCmp)).toBe(true);
  });

  it("sorts a 100k all-equal array (frozen ref: RangeError at 10k)", () => {
    const input = Array.from({ length: N }, () => 7);
    expect(quickSort(input, numCmp)).toEqual(input);
  });

  it("sorts organ-pipe and few-distinct-values inputs", () => {
    const organPipe = Array.from({ length: 50000 }, (_, i) => Math.min(i, 50000 - i));
    expect(isSorted(quickSort(organPipe, numCmp), numCmp)).toBe(true);
    const fewValues = Array.from({ length: 50000 }, (_, i) => i % 3);
    expect(isSorted(quickSort(fewValues, numCmp), numCmp)).toBe(true);
  });
});

describe("sort — randomized oracle vs native Array#sort (property)", () => {
  it.each([1, 2, 3, 4, 5])("quickSort matches native sort (seed %i)", (seed) => {
    const rng = makeRng(seed * 7919);
    for (let round = 0; round < 20; round++) {
      const n = Math.floor(rng() * 500);
      const input = Array.from({ length: n }, () => Math.floor(rng() * 50) - 25);
      const expected = input.slice().sort(numCmp);
      expect(quickSort(input, numCmp)).toEqual(expected);
    }
  });

  it.each([1, 2, 3, 4, 5])("mergeSort matches native sort (seed %i)", (seed) => {
    const rng = makeRng(seed * 104729);
    for (let round = 0; round < 20; round++) {
      const n = Math.floor(rng() * 500);
      const input = Array.from({ length: n }, () => Math.floor(rng() * 50) - 25);
      const expected = input.slice().sort(numCmp);
      expect(mergeSort(input, numCmp)).toEqual(expected);
    }
  });
});

describe("mergeSort — stability verified by property test (ES2019 native sort as oracle)", () => {
  it.each([11, 22, 33, 44])("preserves input order of equal keys (seed %i)", (seed) => {
    const rng = makeRng(seed);
    for (let round = 0; round < 10; round++) {
      const n = 200 + Math.floor(rng() * 400);
      const items = Array.from({ length: n }, (_, seq) => ({
        key: Math.floor(rng() * 8),
        seq,
      }));
      const byKey = (a: { key: number }, b: { key: number }) => a.key - b.key;
      const ours = mergeSort(items, byKey);
      // Native Array#sort is spec-guaranteed stable since ES2019 — exact oracle.
      const oracle = items.slice().sort(byKey);
      expect(ours).toEqual(oracle);
      // Explicit stability invariant: equal keys keep ascending seq.
      for (let i = 1; i < ours.length; i++) {
        const prev = ours[i - 1] as { key: number; seq: number };
        const curr = ours[i] as { key: number; seq: number };
        if (prev.key === curr.key) expect(prev.seq).toBeLessThan(curr.seq);
      }
    }
  });
});

describe("binary search bounds — invariants on random sorted arrays (property)", () => {
  it.each([5, 6, 7])("lowerBound/upperBound/binarySearch agree (seed %i)", (seed) => {
    const rng = makeRng(seed * 31337);
    for (let round = 0; round < 25; round++) {
      const n = Math.floor(rng() * 200);
      const arr = Array.from({ length: n }, () => Math.floor(rng() * 30)).sort(numCmp);
      const value = Math.floor(rng() * 34) - 2;
      const lb = lowerBound(arr, value, numCmp);
      const ub = upperBound(arr, value, numCmp);
      expect(lb).toBeGreaterThanOrEqual(0);
      expect(lb).toBeLessThanOrEqual(ub);
      expect(ub).toBeLessThanOrEqual(n);
      for (let i = 0; i < lb; i++) expect((arr[i] as number) < value).toBe(true);
      for (let i = lb; i < ub; i++) expect(arr[i]).toBe(value);
      for (let i = ub; i < n; i++) expect((arr[i] as number) > value).toBe(true);
      const found = binarySearch(arr, value, numCmp);
      if (lb < ub) {
        expect(found).toBeGreaterThanOrEqual(lb);
        expect(found).toBeLessThan(ub);
      } else {
        expect(found).toBe(-1);
      }
    }
  });
});

describe("isSorted", () => {
  it("detects sorted and unsorted arrays", () => {
    expect(isSorted([], numCmp)).toBe(true);
    expect(isSorted([1], numCmp)).toBe(true);
    expect(isSorted([1, 1, 2, 3], numCmp)).toBe(true);
    expect(isSorted([2, 1], numCmp)).toBe(false);
  });
});
