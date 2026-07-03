import {
  asAsyncCacheAdapter,
  namespacedCacheAdapter,
} from "../../../src/shared/async-cache-adapter";
import { type CacheAdapter, memoryCacheAdapter } from "../../../src/shared/cache-adapter";

describe("asAsyncCacheAdapter", () => {
  it("normalizes a sync adapter to all-Promise", async () => {
    const async = asAsyncCacheAdapter(memoryCacheAdapter<string, number>());
    const p = async.set("a", 1);
    expect(p).toBeInstanceOf(Promise);
    await p;
    await expect(async.get("a")).resolves.toBe(1);
    await expect(async.has("a")).resolves.toBe(true);
    await expect(async.delete("a")).resolves.toBe(true);
  });

  it("normalizes an async adapter unchanged", async () => {
    const backing = new Map<string, number>();
    const asyncBacked: CacheAdapter<string, number> = {
      get: async (k) => backing.get(k),
      set: async (k, v) => void backing.set(k, v),
      delete: async (k) => backing.delete(k),
      has: async (k) => backing.has(k),
    };
    const async = asAsyncCacheAdapter(asyncBacked);
    await async.set("a", 1);
    await expect(async.get("a")).resolves.toBe(1);
  });

  it("falls back to singular ops when batch methods are absent", async () => {
    const backing = new Map<string, number>();
    const minimal: CacheAdapter<string, number> = {
      get: (k) => backing.get(k),
      set: (k, v) => void backing.set(k, v),
      delete: (k) => backing.delete(k),
      has: (k) => backing.has(k),
    };
    const async = asAsyncCacheAdapter(minimal);
    await async.setMany([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    await expect(async.getMany(["a", "b", "c"])).resolves.toEqual([1, 2, undefined]);
    await expect(async.deleteMany(["a", "c"])).resolves.toEqual([true, false]);
  });

  it("uses native batch methods when present", async () => {
    const mem = memoryCacheAdapter<string, number>();
    const getManySpy = jest.spyOn(mem, "getMany");
    const async = asAsyncCacheAdapter(mem);
    mem.set("a", 1);
    await expect(async.getMany(["a"])).resolves.toEqual([1]);
    expect(getManySpy).toHaveBeenCalledTimes(1);
  });

  it("clear falls back to keys()+delete, and rejects loudly when impossible", async () => {
    const backing = new Map<string, number>();
    const noClear: CacheAdapter<string, number> = {
      get: (k) => backing.get(k),
      set: (k, v) => void backing.set(k, v),
      delete: (k) => backing.delete(k),
      has: (k) => backing.has(k),
      keys: () => [...backing.keys()],
    };
    const async = asAsyncCacheAdapter(noClear);
    await async.set("a", 1);
    await async.clear();
    expect(backing.size).toBe(0);

    const impossible = asAsyncCacheAdapter<string, number>({
      get: (k) => backing.get(k),
      set: (k, v) => void backing.set(k, v),
      delete: (k) => backing.delete(k),
      has: (k) => backing.has(k),
    });
    await expect(impossible.clear()).rejects.toThrow(TypeError);
    await expect(impossible.keys()).rejects.toThrow(TypeError);
  });
});

describe("namespacedCacheAdapter", () => {
  it("isolates two namespaces sharing one backend", async () => {
    const shared = memoryCacheAdapter<string, number>();
    const users = namespacedCacheAdapter(shared, "users");
    const posts = namespacedCacheAdapter(shared, "posts");
    await users.set("1", 100);
    await posts.set("1", 200);
    await expect(users.get("1")).resolves.toBe(100);
    await expect(posts.get("1")).resolves.toBe(200);
    expect(shared.keys().sort()).toEqual(["posts:1", "users:1"]);
  });

  it("clear() removes only its own namespace", async () => {
    const shared = memoryCacheAdapter<string, number>();
    const users = namespacedCacheAdapter(shared, "users");
    const posts = namespacedCacheAdapter(shared, "posts");
    await users.set("1", 100);
    await users.set("2", 101);
    await posts.set("1", 200);
    await users.clear();
    await expect(users.has("1")).resolves.toBe(false);
    await expect(users.has("2")).resolves.toBe(false);
    await expect(posts.get("1")).resolves.toBe(200);
  });

  it("keys() lists unprefixed live keys and prunes deleted ones", async () => {
    const shared = memoryCacheAdapter<string, number>();
    const ns = namespacedCacheAdapter(shared, "n");
    await ns.setMany([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    shared.delete("n:b"); // out-of-band delete
    await expect(ns.keys()).resolves.toEqual(["a"]);
    await expect(ns.getMany(["a", "b"])).resolves.toEqual([1, undefined]);
    await expect(ns.deleteMany(["a"])).resolves.toEqual([true]);
  });

  it("passes ttl through to the backend", async () => {
    jest.useFakeTimers();
    try {
      const shared = memoryCacheAdapter<string, number>();
      const ns = namespacedCacheAdapter(shared, "n");
      await ns.set("a", 1, 50);
      jest.advanceTimersByTime(51);
      await expect(ns.get("a")).resolves.toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it("rejects an empty namespace", () => {
    expect(() => namespacedCacheAdapter(memoryCacheAdapter(), "")).toThrow(TypeError);
  });
});
