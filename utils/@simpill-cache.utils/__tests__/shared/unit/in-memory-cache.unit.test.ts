import { InMemoryCache } from "../../../src/shared/in-memory-cache.utils";

describe("InMemoryCache", () => {
  it("get/set/has/delete", () => {
    const cache = new InMemoryCache<string, number>();
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.has("a")).toBe(true);
    cache.delete("a");
    expect(cache.has("a")).toBe(false);
    expect(cache.get("a")).toBeUndefined();
  });

  it("treats stored undefined as present", () => {
    const cache = new InMemoryCache<string, number | undefined>();
    cache.set("u", undefined);
    expect(cache.has("u")).toBe(true);
    expect(cache.get("u")).toBeUndefined();
  });

  it("expires after TTL", () => {
    jest.useFakeTimers();
    const cache = new InMemoryCache<string, number>();
    cache.set("x", 42, 100);
    expect(cache.get("x")).toBe(42);
    jest.advanceTimersByTime(101);
    expect(cache.get("x")).toBeUndefined();
    jest.useRealTimers();
  });

  it("evicts oldest entry when maxSize exceeded", () => {
    const cache = new InMemoryCache<string, number>({ maxSize: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
    cache.set("c", 3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("rejects invalid maxSize", () => {
    expect(() => new InMemoryCache({ maxSize: 0 })).toThrow(
      "maxSize must be a positive finite number"
    );
    expect(() => new InMemoryCache({ maxSize: -1 })).toThrow(
      "maxSize must be a positive finite number"
    );
  });
});
