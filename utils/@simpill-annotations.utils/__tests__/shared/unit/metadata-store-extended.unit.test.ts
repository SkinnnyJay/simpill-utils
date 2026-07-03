import {
  createMetadataKey,
  createMetadataStore,
  getMetadata,
  setMetadata,
} from "../../../src/shared/metadata-store";

describe("MetadataStore extensions", () => {
  it("clear removes all entries and size reflects it", () => {
    const store = createMetadataStore();
    store.set("a", 1);
    store.set("b", 2);
    expect(store.size).toBe(2);
    store.clear();
    expect(store.size).toBe(0);
    expect(store.get("a")).toBeUndefined();
  });

  it("keys/values/entries and iteration enumerate insertion order", () => {
    const store = createMetadataStore();
    const sym = Symbol("s");
    store.set("a", 1);
    store.set(sym, 2);
    expect(Array.from(store.keys())).toEqual(["a", sym]);
    expect(Array.from(store.values())).toEqual([1, 2]);
    expect(Array.from(store.entries())).toEqual([
      ["a", 1],
      [sym, 2],
    ]);
    expect(Array.from(store)).toEqual(Array.from(store.entries()));
  });

  it("getOrSet returns existing value without calling factory", () => {
    const store = createMetadataStore();
    store.set("k", "existing");
    const factory = jest.fn(() => "new");
    expect(store.getOrSet("k", factory)).toBe("existing");
    expect(factory).not.toHaveBeenCalled();
  });

  it("getOrSet stores and returns factory result when absent", () => {
    const store = createMetadataStore();
    expect(store.getOrSet("k", () => 7)).toBe(7);
    expect(store.get("k")).toBe(7);
  });

  it("getOrSet caches falsy and undefined values (has-based, not get-based)", () => {
    const store = createMetadataStore();
    const factory = jest.fn(() => undefined);
    expect(store.getOrSet("u", factory)).toBeUndefined();
    expect(store.getOrSet("u", factory)).toBeUndefined();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(store.has("u")).toBe(true);
  });

  it("createMetadataStore(entries) seeds a copy/snapshot", () => {
    const source = createMetadataStore();
    source.set("a", 1);
    source.set("b", { nested: true });
    const copy = createMetadataStore(source.entries());
    expect(copy.size).toBe(2);
    expect(copy.get("a")).toBe(1);
    copy.set("a", 99);
    expect(source.get("a")).toBe(1); // copies are independent
  });

  it("typed keys carry their value type end to end", () => {
    const store = createMetadataStore();
    const countKey = createMetadataKey<number>("count");
    store.set(countKey, 5);
    const value = store.get(countKey);
    // value: number | undefined — no explicit type argument needed
    expect(value).toBe(5);
    setMetadata(countKey, 6, store);
    expect(getMetadata(countKey, store)).toBe(6);
  });

  it("typed keys are unique symbols even with the same description", () => {
    const a = createMetadataKey<string>("dup");
    const b = createMetadataKey<string>("dup");
    const store = createMetadataStore();
    store.set(a, "A");
    store.set(b, "B");
    expect(store.get(a)).toBe("A");
    expect(store.get(b)).toBe("B");
    expect(store.size).toBe(2);
  });
});

describe("globalMetadataStore duplicate-copy safety", () => {
  it("two isolated module copies share one global store (Symbol.for registry)", () => {
    let first: typeof import("../../../src/shared/metadata-store") | undefined;
    let second: typeof import("../../../src/shared/metadata-store") | undefined;
    jest.isolateModules(() => {
      first = require("../../../src/shared/metadata-store");
    });
    jest.isolateModules(() => {
      second = require("../../../src/shared/metadata-store");
    });
    if (first === undefined || second === undefined) {
      throw new Error("isolateModules did not load module copies");
    }
    expect(first.globalMetadataStore).not.toBe(undefined);
    const key = "annotations.utils.dup-copy.test";
    first.setMetadata(key, "from-copy-one");
    expect(second.getMetadata<string>(key)).toBe("from-copy-one");
    second.globalMetadataStore.delete(key);
    expect(first.getMetadata(key)).toBeUndefined();
  });
});
