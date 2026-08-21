import { memoizeAsync } from "../../../src/shared/memoize-async";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("memoizeAsync stale-while-revalidate", () => {
  afterEach(() => jest.useRealTimers());

  it("requires ttlMs and rejects a custom cache", () => {
    expect(() => memoizeAsync(async () => 1, { staleWhileRevalidateMs: 100 })).toThrow();
    expect(() =>
      memoizeAsync(async () => 1, {
        ttlMs: 100,
        staleWhileRevalidateMs: 100,
        cache: new Map(),
      })
    ).toThrow();
  });

  it("serves fresh within ttl without re-invoking", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout"] }).setSystemTime(0);
    let calls = 0;
    const fn = memoizeAsync(
      async () => {
        calls++;
        return calls;
      },
      { ttlMs: 100, staleWhileRevalidateMs: 100 }
    );
    await expect(fn()).resolves.toBe(1);
    jest.setSystemTime(50);
    await expect(fn()).resolves.toBe(1);
    expect(calls).toBe(1);
  });

  it("within the stale window: returns stale immediately, refreshes in background exactly once", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout"] }).setSystemTime(0);
    let calls = 0;
    const fn = memoizeAsync(
      async () => {
        calls++;
        return calls;
      },
      { ttlMs: 100, staleWhileRevalidateMs: 1000 }
    );
    await expect(fn()).resolves.toBe(1);
    jest.setSystemTime(150); // stale window
    const [a, b, c] = await Promise.all([fn(), fn(), fn()]);
    expect([a, b, c]).toEqual([1, 1, 1]); // stale served, single-flight refresh
    await flush();
    expect(calls).toBe(2); // exactly one background refresh
    await expect(fn()).resolves.toBe(2); // fresh value now served
  });

  it("beyond the stale window: refetches in the foreground", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout"] }).setSystemTime(0);
    let calls = 0;
    const fn = memoizeAsync(
      async () => {
        calls++;
        return calls;
      },
      { ttlMs: 100, staleWhileRevalidateMs: 100 }
    );
    await expect(fn()).resolves.toBe(1);
    jest.setSystemTime(500);
    await expect(fn()).resolves.toBe(2);
    expect(calls).toBe(2);
  });

  it("stale-if-error: failed background refresh keeps serving the stale value", async () => {
    jest.useFakeTimers({ doNotFake: ["setTimeout"] }).setSystemTime(0);
    let calls = 0;
    const fn = memoizeAsync(
      async () => {
        calls++;
        if (calls > 1) throw new Error("boom");
        return "ok";
      },
      { ttlMs: 100, staleWhileRevalidateMs: 10_000 }
    );
    await expect(fn()).resolves.toBe("ok");
    jest.setSystemTime(200);
    await expect(fn()).resolves.toBe("ok"); // stale served, refresh fails silently
    await flush();
    await expect(fn()).resolves.toBe("ok"); // still serving stale, no unhandled rejection
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it("default (non-SWR) path still dedupes rejected promises out of the cache", async () => {
    let calls = 0;
    const fn = memoizeAsync(async () => {
      calls++;
      throw new Error("nope");
    });
    await expect(fn()).rejects.toThrow("nope");
    await flush();
    await expect(fn()).rejects.toThrow("nope");
    expect(calls).toBe(2); // rejection was not cached
  });
});
