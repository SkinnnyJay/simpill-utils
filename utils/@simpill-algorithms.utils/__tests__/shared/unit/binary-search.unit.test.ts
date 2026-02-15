import { binarySearch, lowerBound, upperBound } from "../../../src/shared/binary-search";

const numCmp = (a: number, b: number) => a - b;

describe("binary-search", () => {
  const sorted = [1, 2, 2, 2, 3, 4, 5];

  describe("binarySearch", () => {
    it("finds existing element", () => {
      const idx = binarySearch(sorted, 2, numCmp);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(sorted[idx]).toBe(2);
    });

    it("returns -1 when not found", () => {
      expect(binarySearch(sorted, 6, numCmp)).toBe(-1);
      expect(binarySearch([], 1, numCmp)).toBe(-1);
    });

    it("finds one of the duplicate indices when duplicates exist", () => {
      const idx = binarySearch(sorted, 2, numCmp);
      expect(idx).toBeGreaterThanOrEqual(1);
      expect(idx).toBeLessThanOrEqual(3);
      expect(sorted[idx]).toBe(2);
    });
  });

  describe("lowerBound", () => {
    it("returns first index where arr[i] >= value", () => {
      expect(lowerBound(sorted, 2, numCmp)).toBe(1);
      expect(lowerBound(sorted, 0, numCmp)).toBe(0);
      expect(lowerBound(sorted, 6, numCmp)).toBe(7);
    });

    it("handles empty array", () => {
      expect(lowerBound([], 1, numCmp)).toBe(0);
    });
  });

  describe("upperBound", () => {
    it("returns first index where arr[i] > value", () => {
      expect(upperBound(sorted, 2, numCmp)).toBe(4);
      expect(upperBound(sorted, 5, numCmp)).toBe(7);
    });

    it("handles empty array", () => {
      expect(upperBound([], 1, numCmp)).toBe(0);
    });
  });
});
