import {
  type ObjectSearchMatch,
  StringSearchAlgorithm,
  searchObject,
  searchString,
  searchStringAll,
} from "../../../src/shared/search.utils";

/** The frozen-ref recursive walk, ported verbatim as an order/content oracle. */
function frozenSearchObject(
  obj: unknown,
  options: { maxDepth?: number; predicate?: (p: string, k: string, v: unknown) => boolean } = {},
): ObjectSearchMatch[] {
  const { maxDepth = Number.POSITIVE_INFINITY, predicate } = options;
  const results: ObjectSearchMatch[] = [];
  const pathParts = (p: string): string => (p ? p : ".");
  function walk(value: unknown, path: string, depth: number): void {
    if (depth > maxDepth) return;
    const key = path.split(".").pop() ?? "";
    const isLeaf = value === null || typeof value !== "object";
    if (isLeaf) {
      if (!predicate || predicate(path, key, value)) results.push({ path: pathParts(path), value });
      return;
    }
    if (predicate?.(path, key, value)) results.push({ path: pathParts(path), value });
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

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomTree(rnd: () => number, depth: number): unknown {
  const r = rnd();
  if (depth <= 0 || r < 0.3) {
    const leaf = rnd();
    if (leaf < 0.3) return Math.floor(rnd() * 100);
    if (leaf < 0.6) return `v${Math.floor(rnd() * 100)}`;
    if (leaf < 0.8) return null;
    return rnd() < 0.5;
  }
  if (r < 0.6) {
    const arr = new Array(Math.floor(rnd() * 4));
    for (let i = 0; i < arr.length; i++) arr[i] = randomTree(rnd, depth - 1);
    return arr;
  }
  const obj: Record<string, unknown> = {};
  const n = Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) obj[`k${i}`] = randomTree(rnd, depth - 1);
  return obj;
}

describe("searchObject uplift", () => {
  it("skips circular references instead of crashing (frozen threw RangeError)", () => {
    const a: Record<string, unknown> = { x: 1 };
    a.self = a;
    const matches = searchObject(a);
    expect(matches).toEqual([{ path: "x", value: 1 }]);
  });

  it('onCycle: "throw" raises a descriptive error', () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(() => searchObject(a, { onCycle: "throw" })).toThrow(/[Cc]ircular/);
  });

  it("still visits shared (diamond) sub-objects once per path, like the frozen ref", () => {
    const shared = { leaf: 1 };
    const obj = { a: shared, b: shared };
    const matches = searchObject(obj);
    expect(matches.map((m) => m.path)).toEqual(["a.leaf", "b.leaf"]);
  });

  it("walks 100k-deep trees without stack overflow (frozen threw RangeError)", () => {
    let node: Record<string, unknown> = {};
    const root = node;
    for (let i = 0; i < 100_000; i++) {
      const next: Record<string, unknown> = {};
      node.n = next;
      node = next;
    }
    node.leaf = 7;
    const matches = searchObject(root);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.value).toBe(7);
  });

  it("passes the real key to the predicate for property names containing dots", () => {
    const keys: string[] = [];
    searchObject(
      { "a.b": 1 },
      {
        predicate: (_p, k) => {
          keys.push(k);
          return false;
        },
      },
    );
    // Frozen ref split the path on "." and reported ["", "b"].
    expect(keys).toEqual(["", "a.b"]);
  });

  it("property: identical output (order and content) to the frozen recursive walk on 300 random acyclic trees", () => {
    const rnd = lcg(0xc0ffee);
    for (let i = 0; i < 300; i++) {
      const tree = randomTree(rnd, 5);
      const maxDepth = rnd() < 0.3 ? Math.floor(rnd() * 4) : undefined;
      const predicate =
        rnd() < 0.4 ? (_p: string, _k: string, v: unknown) => typeof v === "number" : undefined;
      expect(searchObject(tree, { maxDepth, predicate })).toEqual(
        frozenSearchObject(tree, { maxDepth, predicate }),
      );
    }
  });
});

describe("searchString / searchStringAll uplift", () => {
  it("searchString results unchanged across all algorithms", () => {
    const h = "abc def ghi def";
    for (const algo of [
      StringSearchAlgorithm.IndexOf,
      StringSearchAlgorithm.Includes,
      StringSearchAlgorithm.Kmp,
    ]) {
      expect(searchString(h, "def", algo)).toBe(4);
      expect(searchString("abc", "x", algo)).toBe(-1);
      expect(searchString("abc", "", algo)).toBe(0);
    }
  });

  it("searchStringAll finds all non-overlapping matches", () => {
    expect(searchStringAll("abc def ghi def", "def")).toEqual([4, 12]);
    expect(searchStringAll("aaaa", "aa")).toEqual([0, 2]);
    expect(searchStringAll("abc", "x")).toEqual([]);
    expect(searchStringAll("abc", "")).toEqual([]);
  });

  it("searchStringAll overlapping mode", () => {
    expect(searchStringAll("aaaa", "aa", { overlapping: true })).toEqual([0, 1, 2]);
    expect(searchStringAll("abababa", "aba", { overlapping: true })).toEqual([0, 2, 4]);
    expect(searchStringAll("abababa", "aba")).toEqual([0, 4]);
  });

  it("KMP and native agree in both modes", () => {
    const cases: Array<[string, string]> = [
      ["aaaa", "aa"],
      ["abababa", "aba"],
      ["mississippi", "issi"],
      ["abc", "abc"],
      ["", "a"],
    ];
    for (const [h, n] of cases) {
      for (const overlapping of [false, true]) {
        expect(
          searchStringAll(h, n, { algorithm: StringSearchAlgorithm.Kmp, overlapping }),
        ).toEqual(searchStringAll(h, n, { overlapping }));
      }
    }
  });

  it("property: searchStringAll matches a naive scan on 200 random cases (seeded)", () => {
    const rnd = lcg(0xbadc0de);
    const alphabet = "ab";
    for (let i = 0; i < 200; i++) {
      const h = Array.from({ length: Math.floor(rnd() * 30) }, () =>
        alphabet.charAt(Math.floor(rnd() * alphabet.length)),
      ).join("");
      const n = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () =>
        alphabet.charAt(Math.floor(rnd() * alphabet.length)),
      ).join("");
      const naive: number[] = [];
      for (let p = 0; p + n.length <= h.length; p++) {
        if (h.startsWith(n, p)) naive.push(p);
      }
      expect(searchStringAll(h, n, { overlapping: true })).toEqual(naive);
      expect(
        searchStringAll(h, n, { algorithm: StringSearchAlgorithm.Kmp, overlapping: true }),
      ).toEqual(naive);
    }
  });
});
