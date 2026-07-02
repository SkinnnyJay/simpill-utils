import { LRUMap } from "../../../src/shared/lru-map";

describe("LRUMap extended", () => {
  it("exposes maxSize and supports delete()", () => {
    const map = new LRUMap<string, number>(3);
    expect(map.maxSize).toBe(3);
    map.set("a", 1);
    expect(map.delete("a")).toBe(true);
    expect(map.delete("a")).toBe(false);
    expect(map.size).toBe(0);
  });

  it("peek() does not update recency", () => {
    const map = new LRUMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    expect(map.peek("a")).toBe(1); // no recency bump
    map.set("c", 3); // should evict "a" (still LRU)
    expect(map.has("a")).toBe(false);
    expect(map.has("b")).toBe(true);
  });

  it("get() refreshes recency for stored undefined values", () => {
    const map = new LRUMap<string, number | undefined>(2);
    map.set("a", undefined);
    map.set("b", 2);
    map.get("a"); // must bump recency even though value is undefined
    map.set("c", 3); // evicts "b", not "a"
    expect(map.has("a")).toBe(true);
    expect(map.has("b")).toBe(false);
  });

  it("evicts correctly when the LRU key is literally undefined", () => {
    const map = new LRUMap<string | undefined, number>(2);
    map.set(undefined, 0);
    map.set("b", 2);
    map.set("c", 3); // must evict the undefined key, not overflow
    expect(map.size).toBe(2);
    expect(map.has(undefined)).toBe(false);
  });

  it("rejects NaN maxSize", () => {
    expect(() => new LRUMap(Number.NaN)).toThrow();
  });

  it("iterates in least-recently-used-first order", () => {
    const map = new LRUMap<string, number>(3);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    map.get("a"); // a becomes MRU
    expect([...map.keys()]).toEqual(["b", "c", "a"]);
    expect([...map.values()]).toEqual([2, 3, 1]);
    expect([...map]).toEqual([["b", 2], ["c", 3], ["a", 1]]);
  });

  it("property: size never exceeds maxSize and matches a reference model", () => {
    const MAX = 8;
    const map = new LRUMap<number, number>(MAX);
    const model: number[] = []; // keys, LRU first
    const values = new Map<number, number>();
    let seed = 42;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 5000; i++) {
      const key = Math.floor(rand() * 20);
      if (rand() < 0.6) {
        map.set(key, i);
        const idx = model.indexOf(key);
        if (idx !== -1) model.splice(idx, 1);
        else if (model.length >= MAX) {
          const evicted = model.shift();
          if (evicted !== undefined) values.delete(evicted);
        }
        model.push(key);
        values.set(key, i);
      } else {
        const got = map.get(key);
        const idx = model.indexOf(key);
        if (idx !== -1) {
          expect(got).toBe(values.get(key));
          model.splice(idx, 1);
          model.push(key);
        } else {
          expect(got).toBeUndefined();
        }
      }
      expect(map.size).toBeLessThanOrEqual(MAX);
      expect(map.size).toBe(model.length);
    }
    expect([...map.keys()]).toEqual(model);
  });
});
