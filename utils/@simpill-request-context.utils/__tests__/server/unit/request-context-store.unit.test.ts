import {
  createRequestContextStore,
  getRequestContext,
  runWithRequestContext,
} from "../../../src/server";

describe("RequestContextStore", () => {
  it("getStore returns undefined when not in run", () => {
    const store = createRequestContextStore();
    expect(store.getStore()).toBeUndefined();
  });

  it("run sets context for sync fn", () => {
    const store = createRequestContextStore();
    const ctx = { requestId: "r1", traceId: "t1" };
    const out = store.run(ctx, () => store.getStore());
    expect(out).toEqual(ctx);
  });

  it("runAsync sets context for async fn", async () => {
    const store = createRequestContextStore();
    const ctx = { requestId: "r2", traceId: "t2" };
    const out = await store.runAsync(ctx, async () => {
      await Promise.resolve();
      return store.getStore();
    });
    expect(out).toEqual(ctx);
  });

  it("context is isolated per run", () => {
    const store = createRequestContextStore();
    let inner: unknown;
    store.run({ requestId: "a" }, () => {
      inner = store.getStore();
    });
    expect(inner).toEqual({ requestId: "a" });
    expect(store.getStore()).toBeUndefined();
  });
});

describe("getRequestContext (default store)", () => {
  it("returns undefined when not in run", () => {
    expect(getRequestContext()).toBeUndefined();
  });

  it("returns context inside runWithRequestContext", async () => {
    const ctx = { requestId: "req-default" };
    const out = await runWithRequestContext(ctx, () => getRequestContext());
    expect(out).toEqual(ctx);
  });
});

describe("runWithRequestContext", () => {
  it("runs sync fn and returns value", async () => {
    const ctx = { requestId: "sync" };
    const result = await runWithRequestContext(ctx, () => 42);
    expect(result).toBe(42);
  });

  it("runs async fn and returns value", async () => {
    const ctx = { requestId: "async" };
    const result = await runWithRequestContext(ctx, async () => {
      await Promise.resolve();
      return getRequestContext()?.requestId;
    });
    expect(result).toBe("async");
  });
});
