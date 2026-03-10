import {
  createRequestContextStore,
  getRequestContext,
  runWithRequestContext,
} from "../../../src/server";

describe("runWithRequestContext", () => {
  it("propagates context across await", async () => {
    const seen: string[] = [];
    await runWithRequestContext({ requestId: "r1" }, async () => {
      seen.push(getRequestContext()?.requestId ?? "missing");
      await Promise.resolve();
      seen.push(getRequestContext()?.requestId ?? "missing");
    });
    expect(seen).toEqual(["r1", "r1"]);
  });

  it("does not leak context to sibling run", async () => {
    const first: string[] = [];
    const second: string[] = [];
    await Promise.all([
      runWithRequestContext({ requestId: "a" }, async () => {
        first.push(getRequestContext()?.requestId ?? "x");
        await Promise.resolve();
        first.push(getRequestContext()?.requestId ?? "x");
      }),
      runWithRequestContext({ requestId: "b" }, async () => {
        second.push(getRequestContext()?.requestId ?? "x");
        await Promise.resolve();
        second.push(getRequestContext()?.requestId ?? "x");
      }),
    ]);
    expect(first).toEqual(["a", "a"]);
    expect(second).toEqual(["b", "b"]);
  });
});

describe("createRequestContextStore isolation", () => {
  it("separate stores have separate context", () => {
    const store1 = createRequestContextStore();
    const store2 = createRequestContextStore();
    const result1 = store1.run({ requestId: "s1" }, () => store2.getStore());
    expect(result1).toBeUndefined();
    const result2 = store1.run({ requestId: "s1" }, () => store1.getStore());
    expect(result2).toEqual({ requestId: "s1" });
  });
});
