import { VALUE_1, VALUE_42 } from "../../../src/shared/constants";
import {
  createMetadataStore,
  getMetadata,
  globalMetadataStore,
  setMetadata,
} from "../../../src/shared/metadata-store";

describe("createMetadataStore", () => {
  it("should get and set by string key", () => {
    const store = createMetadataStore();
    expect(store.get("k")).toBeUndefined();
    store.set("k", VALUE_42);
    expect(store.get<number>("k")).toBe(VALUE_42);
  });

  it("should get and set by symbol key", () => {
    const store = createMetadataStore();
    const sym = Symbol("x");
    store.set(sym, "v");
    expect(store.get<string>(sym)).toBe("v");
  });

  it("should report has and delete", () => {
    const store = createMetadataStore();
    store.set("a", VALUE_1);
    expect(store.has("a")).toBe(true);
    expect(store.has("b")).toBe(false);
    expect(store.delete("a")).toBe(true);
    expect(store.delete("a")).toBe(false);
    expect(store.get("a")).toBeUndefined();
  });
});

describe("getMetadata / setMetadata", () => {
  it("should use provided store", () => {
    const store = createMetadataStore();
    setMetadata("x", VALUE_1, store);
    expect(getMetadata<number>("x", store)).toBe(VALUE_1);
  });

  it("should use globalMetadataStore when store not provided", () => {
    const key = "annotations.utils.test.key";
    setMetadata(key, "global");
    expect(getMetadata<string>(key)).toBe("global");
    globalMetadataStore.delete(key);
  });
});
