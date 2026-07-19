/** @file annotations uplift: the declared-but-dropped target param is honored */
import { createAnnotationsAdapter } from "../../../src/server/annotations-adapter";

const makeStore = () => {
  const store = new Map<string | symbol, unknown>();
  return {
    store,
    adapter: createAnnotationsAdapter({
      get: <T>(k: symbol | string) => store.get(k) as T | undefined,
      set: (k: symbol | string, v: unknown) => store.set(k, v),
    }),
  };
};

describe("per-target metadata", () => {
  it("targets are isolated from each other and from the global store", () => {
    const { store, adapter } = makeStore();
    const a = {};
    const b = {};
    adapter.setMetadata("role", "admin", a);
    adapter.setMetadata("role", "guest", b);
    adapter.setMetadata("role", "global");
    expect(adapter.getMetadata("role", a)).toBe("admin");
    expect(adapter.getMetadata("role", b)).toBe("guest");
    expect(adapter.getMetadata("role")).toBe("global");
    expect(store.get("role")).toBe("global"); // targeted writes never hit the store
    expect(store.size).toBe(1);
  });

  it("reads on un-annotated targets are allocation-free and return undefined", () => {
    const { store, adapter } = makeStore();
    expect(adapter.getMetadata("k", {})).toBeUndefined();
    expect(store.size).toBe(0);
  });

  it("symbol keys work per-target", () => {
    const { adapter } = makeStore();
    const key = Symbol("meta");
    const target = () => {};
    adapter.setMetadata(key, 42, target);
    expect(adapter.getMetadata<number>(key, target)).toBe(42);
    expect(adapter.getMetadata(key)).toBeUndefined();
  });
});
