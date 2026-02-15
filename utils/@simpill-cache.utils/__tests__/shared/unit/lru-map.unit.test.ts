import { LRUMap } from "../../../src/shared/lru-map";

describe("LRUMap", () => {
  it("evicts oldest when over maxSize", () => {
    const map = new LRUMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    expect(map.size).toBe(2);
    expect(map.get("a")).toBeUndefined();
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(3);
  });
});
