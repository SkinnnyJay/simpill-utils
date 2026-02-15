import { RedisCache, type RedisCacheAdapter } from "../../../src/server/redis-cache";

function createMockAdapter(): RedisCacheAdapter & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
  };
}

describe("RedisCache", () => {
  it("rejects set with undefined value", async () => {
    const adapter = createMockAdapter();
    const cache = new RedisCache<number | undefined>(adapter);
    await expect(cache.set("k", undefined)).rejects.toThrow(
      "RedisCache does not support storing undefined"
    );
    expect(adapter.store.has("cache:k")).toBe(false);
  });

  it("set and get round-trip", async () => {
    const adapter = createMockAdapter();
    const cache = new RedisCache<number>(adapter);
    await cache.set("k", 42);
    expect(await cache.get("k")).toBe(42);
  });

  it("get returns undefined for missing key", async () => {
    const adapter = createMockAdapter();
    const cache = new RedisCache<number>(adapter);
    expect(await cache.get("missing")).toBeUndefined();
  });

  it("get throws on invalid JSON", async () => {
    const adapter = createMockAdapter();
    adapter.store.set("cache:bad", "not json {{{");
    const cache = new RedisCache<unknown>(adapter);
    await expect(cache.get("bad")).rejects.toThrow("RedisCache: invalid JSON for key bad");
  });
});
