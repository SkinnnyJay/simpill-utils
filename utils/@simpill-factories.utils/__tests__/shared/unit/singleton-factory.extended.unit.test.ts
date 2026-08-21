import {
  resetSingletonFactory,
  singletonAsyncFactory,
  singletonFactory,
} from "../../../src/shared/singleton-factory";

describe("singletonFactory – caching correctness", () => {
  it("caches a factory that returns undefined (invoked exactly once)", () => {
    let count = 0;
    const get = singletonFactory<undefined>(() => {
      count++;
      return undefined;
    });
    get();
    get();
    get();
    expect(count).toBe(1);
  });

  it("caches null, false, 0, and empty-string results", () => {
    for (const value of [null, false, 0, ""] as const) {
      let count = 0;
      const get = singletonFactory(() => {
        count++;
        return value;
      });
      expect(get()).toBe(value);
      expect(get()).toBe(value);
      expect(count).toBe(1);
    }
  });

  it("does NOT cache a throwing factory — next get() retries", () => {
    let count = 0;
    const get = singletonFactory(() => {
      count++;
      if (count === 1) {
        throw new Error("boot failed");
      }
      return { ok: true };
    });
    expect(() => get()).toThrow("boot failed");
    expect(get()).toEqual({ ok: true });
    expect(get()).toEqual({ ok: true });
    expect(count).toBe(2);
  });

  it("throws a clear error on circular initialization instead of overflowing the stack", () => {
    const get: () => number = singletonFactory<number>(() => get() + 1);
    expect(() => get()).toThrow(/circular initialization/);
    // and the getter still works once the cycle is broken elsewhere
    const fine = singletonFactory(() => 7);
    expect(fine()).toBe(7);
  });

  it("reset after the undefined-value fix still forces re-creation", () => {
    let count = 0;
    const get = singletonFactory(() => {
      count++;
      return undefined;
    });
    get();
    resetSingletonFactory(get);
    get();
    expect(count).toBe(2);
  });
});

describe("singletonAsyncFactory", () => {
  it("concurrent first callers share a single in-flight initialization", async () => {
    let count = 0;
    const get = singletonAsyncFactory(async () => {
      count++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { id: count };
    });
    const [a, b, c] = await Promise.all([get(), get(), get()]);
    expect(count).toBe(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("returns the same instance on later calls", async () => {
    const get = singletonAsyncFactory(async () => ({ ready: true }));
    const first = await get();
    const second = await get();
    expect(first).toBe(second);
  });

  it("evicts a REJECTED initialization so the next call retries (no poisoned cache)", async () => {
    let count = 0;
    const get = singletonAsyncFactory(async () => {
      count++;
      if (count === 1) {
        throw new Error("connect failed");
      }
      return { connected: true };
    });
    await expect(get()).rejects.toThrow("connect failed");
    await expect(get()).resolves.toEqual({ connected: true });
    await expect(get()).resolves.toEqual({ connected: true });
    expect(count).toBe(2);
  });

  it("a synchronously-throwing factory rejects (never throws sync) and is not cached", async () => {
    let count = 0;
    const get = singletonAsyncFactory<number>(() => {
      count++;
      if (count === 1) {
        throw new Error("sync boom");
      }
      return 42;
    });
    await expect(get()).rejects.toThrow("sync boom");
    await expect(get()).resolves.toBe(42);
  });

  it("wraps sync-returning factories in a promise", async () => {
    const get = singletonAsyncFactory(() => 5);
    const pending = get();
    expect(typeof pending.then).toBe("function");
    await expect(pending).resolves.toBe(5);
  });

  it("resetSingletonFactory forces re-initialization", async () => {
    let count = 0;
    const get = singletonAsyncFactory(async () => ++count);
    await expect(get()).resolves.toBe(1);
    resetSingletonFactory(get);
    await expect(get()).resolves.toBe(2);
  });

  it("a late rejection does not evict a NEWER post-reset initialization", async () => {
    let mode: "slow-fail" | "ok" = "slow-fail";
    let resolveGate: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      resolveGate = resolve;
    });
    const get = singletonAsyncFactory(async () => {
      if (mode === "slow-fail") {
        await gate;
        throw new Error("late failure");
      }
      return "fresh";
    });
    const failing = get();
    failing.catch(() => undefined); // observed later
    resetSingletonFactory(get);
    mode = "ok";
    const replacement = get(); // cached anew while the old one is still in flight
    resolveGate();
    await expect(failing).rejects.toThrow("late failure");
    // the late rejection must NOT have evicted the replacement
    await expect(get()).resolves.toBe("fresh");
    await expect(replacement).resolves.toBe("fresh");
  });
});
