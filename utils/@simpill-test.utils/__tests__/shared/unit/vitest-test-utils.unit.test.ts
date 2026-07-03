import {
  deferred,
  ref,
  runAsync,
  WaitUntilTimeoutError,
  waitMs,
  waitUntil,
} from "../../../src/shared/vitest-test-utils";

describe("runAsync", () => {
  it("awaits plain promises", async () => {
    let done = false;
    await runAsync(async () => {
      await waitMs(5);
      done = true;
    });
    expect(done).toBe(true);
  });

  // REGRESSION: `result instanceof Promise` missed custom thenables — they
  // were returned un-awaited, so async work was silently not flushed.
  it("awaits custom thenables (not just Promise instances)", async () => {
    let done = false;
    const thenable = {
      // biome-ignore lint/suspicious/noThenProperty: a custom thenable is the point of this regression test
      then(resolve: () => void): void {
        setTimeout(() => {
          done = true;
          resolve();
        }, 5);
      },
    };
    await runAsync(() => thenable as unknown as Promise<void>);
    expect(done).toBe(true);
  });

  it("handles sync functions", async () => {
    let done = false;
    await runAsync(() => {
      done = true;
    });
    expect(done).toBe(true);
  });
});

describe("deferred", () => {
  it("exposes settlement state", async () => {
    const d = deferred<number>();
    expect(d.state).toBe("pending");
    d.resolve(1);
    expect(d.state).toBe("fulfilled");
    await expect(d.promise).resolves.toBe(1);

    const r = deferred<number>();
    r.reject(new Error("no"));
    expect(r.state).toBe("rejected");
    await expect(r.promise).rejects.toThrow("no");
  });

  it("settlement is first-wins", async () => {
    const d = deferred<number>();
    d.resolve(1);
    d.reject(new Error("late"));
    expect(d.state).toBe("fulfilled");
    await expect(d.promise).resolves.toBe(1);
  });
});

describe("ref", () => {
  it("holds a mutable value", () => {
    const r = ref(1);
    r.value = 2;
    expect(r.value).toBe(2);
  });
});

describe("waitMs", () => {
  it("resolves after the delay", async () => {
    const start = Date.now();
    await waitMs(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });

  it("rejects when the signal aborts", async () => {
    const ctrl = new AbortController();
    const p = waitMs(5000, { signal: ctrl.signal });
    ctrl.abort(new Error("stop"));
    await expect(p).rejects.toThrow("stop");
  });

  it("rejects immediately on an already-aborted signal", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(waitMs(5000, { signal: ctrl.signal })).rejects.toBeDefined();
  });
});

describe("waitUntil", () => {
  it("resolves with the truthy value once the condition is met", async () => {
    let calls = 0;
    const value = await waitUntil(
      () => {
        calls++;
        return calls >= 3 ? "ready" : "";
      },
      { intervalMs: 5 },
    );
    expect(value).toBe("ready");
    expect(calls).toBe(3);
  });

  it("supports async conditions", async () => {
    let flag = false;
    setTimeout(() => {
      flag = true;
    }, 30);
    const value = await waitUntil(async () => flag, { timeoutMs: 2000, intervalMs: 5 });
    expect(value).toBe(true);
  });

  it("retries throwing conditions and reports the last error on timeout", async () => {
    let caught: unknown;
    try {
      await waitUntil(
        () => {
          throw new Error("not yet");
        },
        { timeoutMs: 50, intervalMs: 5, message: "widget mounted" },
      );
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(WaitUntilTimeoutError);
    const e = caught as WaitUntilTimeoutError;
    expect(e.message).toContain("50ms");
    expect(e.message).toContain("widget mounted");
    expect((e.lastError as Error).message).toBe("not yet");
  });

  it("times out on a never-truthy condition", async () => {
    await expect(waitUntil(() => false, { timeoutMs: 40, intervalMs: 5 })).rejects.toBeInstanceOf(
      WaitUntilTimeoutError,
    );
  });

  it("aborts via signal", async () => {
    const ctrl = new AbortController();
    const p = waitUntil(() => false, { timeoutMs: 5000, intervalMs: 5, signal: ctrl.signal });
    setTimeout(() => ctrl.abort(new Error("cancelled")), 15);
    await expect(p).rejects.toThrow("cancelled");
  });
});
