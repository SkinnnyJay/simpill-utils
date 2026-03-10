import {
  chunk,
  compact,
  countBy,
  difference,
  drop,
  dropRight,
  ensureArray,
  first,
  flattenOnce,
  groupBy,
  intersection,
  isArrayLike,
  isNonEmptyArray,
  keyBy,
  last,
  partition,
  sample,
  shuffle,
  sortBy,
  take,
  takeRight,
  union,
  unique,
  uniqueBy,
  unzip,
  zip,
} from "../../../src/shared/array.utils";

describe("array.utils", () => {
  it("isNonEmptyArray", () => {
    expect(isNonEmptyArray([1])).toBe(true);
    expect(isNonEmptyArray([])).toBe(false);
    expect(isNonEmptyArray(null)).toBe(false);
  });

  it("unique", () => {
    expect(unique([1, 2, 1, 3, 2])).toEqual([1, 2, 3]);
  });

  it("uniqueBy", () => {
    expect(uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], (x) => x.id)).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
  });

  it("chunk", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("compact", () => {
    expect(compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
  });

  it("flattenOnce", () => {
    expect(flattenOnce([[1, 2], [3], 4])).toEqual([1, 2, 3, 4]);
  });

  it("groupBy", () => {
    const map = groupBy([{ g: "a" }, { g: "b" }, { g: "a" }], (x) => x.g);
    expect(map.get("a")).toEqual([{ g: "a" }, { g: "a" }]);
    expect(map.get("b")).toEqual([{ g: "b" }]);
  });

  it("sortBy", () => {
    expect(sortBy([3, 1, 2], (x) => x)).toEqual([1, 2, 3]);
    expect(sortBy([3, 1, 2], (x) => x, "desc")).toEqual([3, 2, 1]);
  });

  it("isArrayLike", () => {
    expect(isArrayLike([1])).toBe(true);
    expect(isArrayLike([])).toBe(true);
    expect(isArrayLike(null)).toBe(false);
    expect(isArrayLike("a")).toBe(false);
  });

  it("partition", () => {
    const [evens, odds] = partition([1, 2, 3, 4, 5], (x) => x % 2 === 0);
    expect(evens).toEqual([2, 4]);
    expect(odds).toEqual([1, 3, 5]);
  });

  it("ensureArray", () => {
    expect(ensureArray([1, 2])).toEqual([1, 2]);
    expect(ensureArray(1)).toEqual([1]);
    expect(ensureArray(null)).toEqual([]);
    expect(ensureArray(undefined)).toEqual([]);
  });

  it("first", () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(first([])).toBeUndefined();
  });

  it("last", () => {
    expect(last([1, 2, 3])).toBe(3);
    expect(last([])).toBeUndefined();
  });

  it("take", () => {
    expect(take([1, 2, 3, 4], 2)).toEqual([1, 2]);
    expect(take([1, 2], 5)).toEqual([1, 2]);
    expect(take([1], 0)).toEqual([]);
  });

  it("drop", () => {
    expect(drop([1, 2, 3, 4], 2)).toEqual([3, 4]);
    expect(drop([1, 2], 5)).toEqual([]);
  });

  it("takeRight", () => {
    expect(takeRight([1, 2, 3, 4], 2)).toEqual([3, 4]);
    expect(takeRight([1], 0)).toEqual([]);
  });

  it("dropRight", () => {
    expect(dropRight([1, 2, 3, 4], 2)).toEqual([1, 2]);
  });

  it("zip", () => {
    expect(zip([1, 2, 3], ["a", "b"])).toEqual([
      [1, "a"],
      [2, "b"],
    ]);
  });

  it("unzip", () => {
    expect(
      unzip([
        [1, "a"],
        [2, "b"],
      ]),
    ).toEqual([
      [1, 2],
      ["a", "b"],
    ]);
  });

  it("keyBy", () => {
    const map = keyBy(
      [
        { id: 1, n: "x" },
        { id: 2, n: "y" },
      ],
      (x) => x.id,
    );
    expect(map.get(1)).toEqual({ id: 1, n: "x" });
    expect(map.get(2)).toEqual({ id: 2, n: "y" });
  });

  it("countBy", () => {
    const map = countBy(["a", "b", "a", "c", "a"], (x) => x);
    expect(map.get("a")).toBe(3);
    expect(map.get("b")).toBe(1);
    expect(map.get("c")).toBe(1);
  });

  it("intersection", () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });

  it("difference", () => {
    expect(difference([1, 2, 3], [2])).toEqual([1, 3]);
  });

  it("union", () => {
    expect(union([1, 2], [2, 3])).toEqual([1, 2, 3]);
  });

  it("sample", () => {
    expect(sample([])).toBeUndefined();
    const one = [42];
    expect(sample(one)).toBe(42);
  });

  it("shuffle", () => {
    const orig = [1, 2, 3];
    const out = shuffle(orig);
    expect(out).toHaveLength(3);
    expect(out.sort()).toEqual([1, 2, 3]);
    expect(orig).toEqual([1, 2, 3]);
  });
});
