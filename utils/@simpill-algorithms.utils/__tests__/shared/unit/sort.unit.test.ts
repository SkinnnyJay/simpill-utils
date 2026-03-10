import { mergeSort, quickSort } from "../../../src/shared/sort";

const numCmp = (a: number, b: number) => a - b;

describe("sort", () => {
  describe("mergeSort", () => {
    it("sorts numbers ascending", () => {
      expect(mergeSort([3, 1, 4, 1, 5], numCmp)).toEqual([1, 1, 3, 4, 5]);
    });

    it("is stable", () => {
      const items = [
        { k: 1, id: "a" },
        { k: 2, id: "b" },
        { k: 1, id: "c" },
      ];
      const sorted = mergeSort(items, (a, b) => a.k - b.k);
      expect(sorted.map((x) => x.id)).toEqual(["a", "c", "b"]);
    });

    it("returns new array", () => {
      const orig = [2, 1];
      const result = mergeSort(orig, numCmp);
      expect(result).toEqual([1, 2]);
      expect(orig).toEqual([2, 1]);
    });

    it("handles empty and single element", () => {
      expect(mergeSort([], numCmp)).toEqual([]);
      expect(mergeSort([1], numCmp)).toEqual([1]);
    });
  });

  describe("quickSort", () => {
    it("sorts numbers ascending", () => {
      expect(quickSort([3, 1, 4, 1, 5], numCmp)).toEqual([1, 1, 3, 4, 5]);
    });

    it("returns new array", () => {
      const orig = [2, 1];
      const result = quickSort(orig, numCmp);
      expect(result).toEqual([1, 2]);
      expect(orig).toEqual([2, 1]);
    });

    it("handles empty and single element", () => {
      expect(quickSort([], numCmp)).toEqual([]);
      expect(quickSort([1], numCmp)).toEqual([1]);
    });
  });
});
