/**
 * @file extended path support: bracket/array-index notation, array-form
 * paths, auto-array creation, deleteByPath, toPathSegments, and a
 * seeded property test asserting set-then-get round-trips.
 */

import {
  deleteByPath,
  getByPath,
  hasPath,
  type PropertyPath,
  setByPath,
  toPathSegments,
} from "../../../src/shared/get-set";

describe("toPathSegments", () => {
  it("parses dot notation", () => {
    expect(toPathSegments("a.b.c")).toEqual(["a", "b", "c"]);
  });
  it("parses bracket + index notation", () => {
    expect(toPathSegments("users[0].name")).toEqual(["users", "0", "name"]);
    expect(toPathSegments("a[0][1].b")).toEqual(["a", "0", "1", "b"]);
  });
  it("parses quoted bracket keys containing dots", () => {
    expect(toPathSegments('a["b.c"].d')).toEqual(["a", "b.c", "d"]);
    expect(toPathSegments("a['x.y']")).toEqual(["a", "x.y"]);
  });
  it("passes array paths through as strings", () => {
    expect(toPathSegments(["a", 0, "b"])).toEqual(["a", "0", "b"]);
  });
  it("empty string yields no segments", () => {
    expect(toPathSegments("")).toEqual([]);
  });
});

describe("getByPath — array index support", () => {
  const obj = { users: [{ name: "john" }, { name: "jane" }] };
  it("reads an array element via bracket path", () => {
    expect(getByPath(obj, "users[0].name")).toBe("john");
    expect(getByPath(obj, "users[1].name")).toBe("jane");
  });
  it("reads via array-form path", () => {
    expect(getByPath(obj, ["users", "1", "name"])).toBe("jane");
    expect(getByPath(obj, ["users", 0, "name"])).toBe("john");
  });
  it("returns undefined for out-of-range index without throwing", () => {
    expect(getByPath(obj, "users[9].name")).toBeUndefined();
  });
});

describe("hasPath — array index support", () => {
  const obj = { a: [{ b: 1 }] };
  it("is true for an existing index path", () => {
    expect(hasPath(obj, "a[0].b")).toBe(true);
  });
  it("is false for a missing index path", () => {
    expect(hasPath(obj, "a[5].b")).toBe(false);
  });
});

describe("setByPath — auto container creation", () => {
  it("creates arrays when the next segment is an index", () => {
    const obj: Record<string, unknown> = {};
    setByPath(obj, "users[0].profile.theme", "dark");
    expect(Array.isArray(obj.users)).toBe(true);
    expect(getByPath(obj, "users[0].profile.theme")).toBe("dark");
  });
  it("creates objects when the next segment is not an index", () => {
    const obj: Record<string, unknown> = {};
    setByPath(obj, "a.b.c", 1);
    expect(Array.isArray(obj.a)).toBe(false);
    expect(getByPath(obj, "a.b.c")).toBe(1);
  });
  it("writes into an existing array via bracket path", () => {
    const obj: Record<string, unknown> = { list: [10, 20] };
    setByPath(obj, "list[1]", 99);
    expect(obj.list).toEqual([10, 99]);
  });
});

describe("deleteByPath", () => {
  it("removes a nested own property and returns true", () => {
    const obj = { a: { b: { c: 1 } } };
    expect(deleteByPath(obj, "a.b.c")).toBe(true);
    expect(hasPath(obj, "a.b.c")).toBe(false);
  });
  it("removes an array element key via bracket path", () => {
    const obj = { a: [{ x: 1 }] };
    expect(deleteByPath(obj, "a[0].x")).toBe(true);
    expect(getByPath(obj, "a[0].x")).toBeUndefined();
  });
  it("returns false for a missing path", () => {
    expect(deleteByPath({ a: {} }, "a.b.c")).toBe(false);
    expect(deleteByPath({}, "")).toBe(false);
  });
  it("refuses forbidden segments", () => {
    expect(deleteByPath({}, "__proto__.x")).toBe(false);
  });
});

describe("set/get round-trip property test (seeded LCG)", () => {
  it("get after set returns the set value for random safe paths", () => {
    let seed = 0x1234_5678;
    const rand = () => {
      seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
      return seed / 0x7fff_ffff;
    };
    const keys = ["a", "b", "c", "d", "e"];
    for (let iter = 0; iter < 500; iter++) {
      const depth = 1 + Math.floor(rand() * 4);
      const segs: string[] = [];
      for (let d = 0; d < depth; d++) {
        // mix object keys and numeric indices
        segs.push(
          rand() < 0.4 ? String(Math.floor(rand() * 3)) : keys[Math.floor(rand() * keys.length)]
        );
      }
      const path: PropertyPath = segs;
      const value = Math.floor(rand() * 1000);
      const obj: Record<string, unknown> = {};
      setByPath(obj, path, value);
      expect(getByPath(obj, path)).toBe(value);
      expect(hasPath(obj, path)).toBe(true);
    }
  });
});
