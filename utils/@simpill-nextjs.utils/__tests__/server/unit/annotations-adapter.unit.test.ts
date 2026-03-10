import {
  createAnnotationsAdapter,
  createNoopAnnotations,
} from "../../../src/server/annotations-adapter";

describe("createNoopAnnotations", () => {
  it("getMetadata returns undefined", () => {
    const a = createNoopAnnotations();
    expect(a.getMetadata(Symbol("x"))).toBeUndefined();
  });

  it("setMetadata does nothing", () => {
    const a = createNoopAnnotations();
    expect(() => a.setMetadata("k", 1)).not.toThrow();
  });
});

describe("createAnnotationsAdapter", () => {
  it("get/set via store", () => {
    const store = new Map<string | symbol, unknown>();
    const a = createAnnotationsAdapter({
      get: <T>(k: symbol | string) => store.get(k) as T | undefined,
      set: (k, v) => store.set(k, v),
    });
    a.setMetadata("foo", 42);
    expect(a.getMetadata<number>("foo")).toBe(42);
  });
});
