import { BoundedLRUMap } from "../../../src/server";

describe("BoundedLRUMap", () => {
  it("evicts oldest when over maxSize", () => {
    const map = new BoundedLRUMap<string, number>(2);
    map.set("a", 1);
    map.set("b", 2);
    map.set("c", 3);
    expect(map.size).toBe(2);
    expect(map.get("a")).toBeUndefined();
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(3);
  });

  it("get moves key to recent", () => {
    const map2 = new BoundedLRUMap<string, number>(2);
    map2.set("a", 1);
    map2.set("b", 2);
    map2.get("a");
    map2.set("c", 3);
    expect(map2.has("a")).toBe(true);
    expect(map2.has("b")).toBe(false);
  });
});
