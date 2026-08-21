import {
  chunk,
  flattenOnce,
  groupBy,
  intersection,
  maxBy,
  minBy,
  range,
  sample,
  sampleSize,
  shuffle,
  sortBy,
  sumBy,
  symmetricDifference,
  unique,
  uniqueBy,
  windowed,
  zipWith,
} from "../../../src/shared/array.utils";

/** Deterministic LCG in [0, 1) for property tests (Numerical Recipes constants). */
function makeLcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe("flattenOnce — large-array safety", () => {
  it("does not throw RangeError on a 300k-element inner array (spread-push regression)", () => {
    const big = new Array(300_000).fill(1);
    const out = flattenOnce([big, [2], 3]);
    expect(out).toHaveLength(300_002);
    expect(out[0]).toBe(1);
    expect(out[300_000]).toBe(2);
    expect(out[300_001]).toBe(3);
  });

  it("accepts iterables", () => {
    function* gen() {
      yield [1, 2];
      yield 3;
    }
    expect(flattenOnce(gen())).toEqual([1, 2, 3]);
  });
});

describe("sortBy — stability, key-call count, NaN/undefined keys", () => {
  it("is stable (equal keys keep input order)", () => {
    const input = [
      { k: 1, tag: "a" },
      { k: 0, tag: "b" },
      { k: 1, tag: "c" },
      { k: 0, tag: "d" },
      { k: 1, tag: "e" },
    ];
    const out = sortBy(input, (x) => x.k);
    expect(out.map((x) => x.tag)).toEqual(["b", "d", "a", "c", "e"]);
  });

  it("calls keyFn exactly once per element", () => {
    let calls = 0;
    const arr = Array.from({ length: 1000 }, () => Math.random());
    sortBy(arr, (x) => {
      calls++;
      return x;
    });
    expect(calls).toBe(1000);
  });

  it("sorts NaN/undefined/null keys deterministically last in both orders", () => {
    const arr = [3, Number.NaN, 1, undefined, 2, null] as Array<number | null | undefined>;
    expect(sortBy(arr, (x) => x as number).slice(0, 3)).toEqual([1, 2, 3]);
    expect(sortBy(arr, (x) => x as number, "desc").slice(0, 3)).toEqual([3, 2, 1]);
    // missing keys are at the tail either way
    for (const order of ["asc", "desc"] as const) {
      const tail = sortBy(arr, (x) => x as number, order).slice(3);
      expect(tail).toHaveLength(3);
      for (const v of tail) expect(v === null || v === undefined || Number.isNaN(v)).toBe(true);
    }
  });

  it("supports multi-key sorting with tie-break", () => {
    const rows = [
      { dept: "b", age: 30 },
      { dept: "a", age: 40 },
      { dept: "a", age: 20 },
      { dept: "b", age: 10 },
    ];
    const out = sortBy(rows, [(r) => r.dept, (r) => r.age]);
    expect(out).toEqual([
      { dept: "a", age: 20 },
      { dept: "a", age: 40 },
      { dept: "b", age: 10 },
      { dept: "b", age: 30 },
    ]);
  });

  it("property: matches native stable sort oracle on 200 random arrays", () => {
    const rng = makeLcg(42);
    for (let trial = 0; trial < 200; trial++) {
      const n = Math.floor(rng() * 60);
      const arr = Array.from({ length: n }, (_, i) => ({
        k: Math.floor(rng() * 8),
        i,
      }));
      const expected = arr.map((x) => x).sort((a, b) => a.k - b.k); // native sort is stable per ES2019
      expect(sortBy(arr, (x) => x.k)).toEqual(expected);
    }
  });

  it("does not mutate the input", () => {
    const arr = [3, 1, 2];
    sortBy(arr, (x) => x);
    expect(arr).toEqual([3, 1, 2]);
  });
});

describe("chunk — non-integer sizes", () => {
  it("floors fractional sizes so chunks are even", () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 2.5)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("returns [] for NaN size and keeps Infinity as one chunk", () => {
    expect(chunk([1, 2], Number.NaN)).toEqual([]);
    expect(chunk([1, 2], Number.POSITIVE_INFINITY)).toEqual([[1, 2]]);
  });
});

describe("intersection — Set semantics", () => {
  it("dedupes the result as documented", () => {
    expect(intersection([1, 1, 2, 3, 2], [1, 2])).toEqual([1, 2]);
  });

  it("preserves first-occurrence order of a", () => {
    expect(intersection([3, 1, 2], [1, 2, 3])).toEqual([3, 1, 2]);
  });
});

describe("symmetricDifference", () => {
  it("returns elements in exactly one array, a-first", () => {
    expect(symmetricDifference([1, 2, 3], [3, 4, 5])).toEqual([1, 2, 4, 5]);
    expect(symmetricDifference([1, 1, 2], [2, 2, 3])).toEqual([1, 3]);
    expect(symmetricDifference([], [1])).toEqual([1]);
  });
});

describe("zipWith", () => {
  it("combines pairwise with index, length = min", () => {
    expect(zipWith([1, 2, 3], [10, 20], (a, b, i) => a + b + i)).toEqual([11, 23]);
  });
});

describe("sample / shuffle / sampleSize — injectable rng", () => {
  it("sample is deterministic with a seeded rng", () => {
    const rng = makeLcg(7);
    const rng2 = makeLcg(7);
    expect(sample([10, 20, 30, 40], rng)).toBe(sample([10, 20, 30, 40], rng2));
  });

  it("shuffle is deterministic with a seeded rng and is a permutation", () => {
    const arr = range(20);
    const a = shuffle(arr, makeLcg(99));
    const b = shuffle(arr, makeLcg(99));
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(arr);
    expect(arr).toEqual(range(20)); // input untouched
  });

  it("sampleSize returns k distinct positions, clamped, without mutation", () => {
    const arr = range(10);
    const out = sampleSize(arr, 4, makeLcg(1));
    expect(out).toHaveLength(4);
    expect(new Set(out).size).toBe(4);
    expect(sampleSize(arr, 99).length).toBe(10);
    expect(sampleSize(arr, 0)).toEqual([]);
    expect(sampleSize(arr, -3)).toEqual([]);
    expect(sampleSize(arr, Number.NaN)).toEqual([]);
    expect(arr).toEqual(range(10));
  });

  it("property: sampleSize(k) is always a k-subset of the input", () => {
    const rng = makeLcg(5);
    const src = range(30);
    const inSrc = new Set(src);
    for (let t = 0; t < 100; t++) {
      const k = Math.floor(rng() * 31);
      const out = sampleSize(src, k, rng);
      expect(out).toHaveLength(k);
      expect(new Set(out).size).toBe(k);
      for (const v of out) expect(inSrc.has(v)).toBe(true);
    }
  });
});

describe("minBy / maxBy", () => {
  it("finds extremes and skips NaN/nullish keys", () => {
    const rows = [{ v: 3 }, { v: Number.NaN }, { v: 1 }, { v: 7 }];
    expect(minBy(rows, (r) => r.v)).toEqual({ v: 1 });
    expect(maxBy(rows, (r) => r.v)).toEqual({ v: 7 });
    expect(minBy([], (x: { v: number }) => x.v)).toBeUndefined();
    expect(minBy([{ v: Number.NaN }], (r) => r.v)).toBeUndefined();
  });

  it("works with string keys and returns first winner on ties", () => {
    const rows = [
      { name: "bob", tag: 1 },
      { name: "amy", tag: 2 },
      { name: "amy", tag: 3 },
    ];
    expect(minBy(rows, (r) => r.name)).toEqual({ name: "amy", tag: 2 });
  });
});

describe("sumBy — compensated summation", () => {
  it("0.1 ten times sums to exactly 1", () => {
    expect(sumBy(new Array(10).fill(0), () => 0.1)).toBe(1);
  });

  it("survives catastrophic cancellation", () => {
    expect(sumBy([1e100, 1, -1e100], (x) => x)).toBe(1);
  });

  it("empty iterable sums to 0", () => {
    expect(sumBy([], (x: number) => x)).toBe(0);
  });

  it("propagates infinities instead of turning them into NaN", () => {
    // The compensation term is NaN on a non-finite total (Infinity - Infinity), so adding it
    // unconditionally made this less accurate than a naive reduce on exactly these inputs.
    const identity = (x: number): number => x;
    expect(sumBy([Number.POSITIVE_INFINITY], identity)).toBe(Number.POSITIVE_INFINITY);
    expect(sumBy([1, Number.POSITIVE_INFINITY], identity)).toBe(Number.POSITIVE_INFINITY);
    expect(sumBy([Number.NEGATIVE_INFINITY], identity)).toBe(Number.NEGATIVE_INFINITY);
    expect(sumBy([Number.MAX_VALUE, Number.MAX_VALUE], identity)).toBe(Number.POSITIVE_INFINITY);
  });

  it("still yields NaN for genuinely undefined sums", () => {
    const identity = (x: number): number => x;
    expect(sumBy([Number.NaN], identity)).toBeNaN();
    expect(sumBy([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY], identity)).toBeNaN();
  });
});

describe("range", () => {
  it("covers single-arg, two-arg, negative auto-step and explicit step", () => {
    expect(range(3)).toEqual([0, 1, 2]);
    expect(range(1, 4)).toEqual([1, 2, 3]);
    expect(range(4, 1)).toEqual([4, 3, 2]);
    expect(range(0, 10, 3)).toEqual([0, 3, 6, 9]);
    expect(range(0)).toEqual([]);
    expect(range(2, 2)).toEqual([]);
  });

  it("throws on step 0 / NaN / Infinity", () => {
    expect(() => range(0, 5, 0)).toThrow(RangeError);
    expect(() => range(0, 5, Number.NaN)).toThrow(RangeError);
    expect(() => range(0, 5, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("windowed", () => {
  it("produces sliding windows with step", () => {
    expect(windowed([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
    expect(windowed([1, 2, 3, 4, 5], 2, 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("supports partial windows and rejects invalid size/step", () => {
    expect(windowed([1, 2, 3], 2, 2, true)).toEqual([[1, 2], [3]]);
    expect(windowed([1, 2, 3], 0)).toEqual([]);
    expect(windowed([1, 2, 3], 2, 0)).toEqual([]);
    expect(windowed([1, 2], 5)).toEqual([]);
    expect(windowed([1, 2], 5, 1, true)).toEqual([[1, 2], [2]]);
  });
});

describe("iterable inputs (widened signatures)", () => {
  it("unique/uniqueBy/groupBy accept generators", () => {
    function* gen() {
      yield 1;
      yield 2;
      yield 1;
    }
    expect(unique(gen())).toEqual([1, 2]);
    expect(uniqueBy(gen(), (x) => x % 2)).toEqual([1, 2]);
    expect(groupBy(gen(), (x) => x)?.get(1)).toEqual([1, 1]);
  });
});
