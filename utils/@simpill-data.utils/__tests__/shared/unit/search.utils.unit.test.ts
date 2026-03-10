import {
  StringSearchAlgorithm,
  searchObject,
  searchString,
} from "../../../src/shared/search.utils";

describe("search.utils", () => {
  describe("searchString", () => {
    const haystack = "abc def ghi def";
    const needle = "def";

    it("IndexOf returns first index", () => {
      expect(searchString(haystack, needle, StringSearchAlgorithm.IndexOf)).toBe(4);
    });
    it("Includes returns first index when present", () => {
      expect(searchString(haystack, needle, StringSearchAlgorithm.Includes)).toBe(4);
    });
    it("Includes returns -1 when absent", () => {
      expect(searchString("abc", "x", StringSearchAlgorithm.Includes)).toBe(-1);
    });
    it("Kmp returns first index", () => {
      expect(searchString(haystack, needle, StringSearchAlgorithm.Kmp)).toBe(4);
    });
    it("Kmp returns -1 when absent", () => {
      expect(searchString("abc", "x", StringSearchAlgorithm.Kmp)).toBe(-1);
    });
    it("default algorithm is Includes", () => {
      expect(searchString(haystack, needle)).toBe(4);
    });
    it("empty needle returns 0 for IndexOf/Includes", () => {
      expect(searchString("abc", "", StringSearchAlgorithm.IndexOf)).toBe(0);
      expect(searchString("abc", "", StringSearchAlgorithm.Includes)).toBe(0);
    });
    it("Kmp empty pattern returns 0", () => {
      expect(searchString("abc", "", StringSearchAlgorithm.Kmp)).toBe(0);
    });
  });

  describe("searchObject", () => {
    it("returns leaf values without predicate", () => {
      const obj = { a: 1, b: { c: 2 } };
      const matches = searchObject(obj);
      expect(matches).toHaveLength(2);
      const paths = matches.map((m) => m.path).sort();
      expect(paths).toEqual(["a", "b.c"]);
      expect(matches.find((m) => m.path === "a")?.value).toBe(1);
      expect(matches.find((m) => m.path === "b.c")?.value).toBe(2);
    });

    it("respects maxDepth", () => {
      const obj = { a: 1, b: { c: { d: 2 } } };
      const matches = searchObject(obj, { maxDepth: 1 });
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ path: "a", value: 1 });
    });

    it("includes array indices in path", () => {
      const obj = { items: [10, 20] };
      const matches = searchObject(obj);
      expect(matches).toHaveLength(2);
      expect(matches.map((m) => m.path).sort()).toEqual(["items.0", "items.1"]);
      expect(matches.find((m) => m.path === "items.0")?.value).toBe(10);
    });

    it("predicate filters results", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const matches = searchObject(obj, {
        predicate: (_path, key, value) => key === "b" || value === 3,
      });
      expect(matches).toHaveLength(2);
      expect(matches.map((m) => m.path).sort()).toEqual(["b", "c"]);
    });

    it("handles nested objects and arrays", () => {
      const obj = { x: [{ y: "leaf" }] };
      const matches = searchObject(obj);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ path: "x.0.y", value: "leaf" });
    });
  });
});
