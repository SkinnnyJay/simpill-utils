import { retry } from "../../../src/shared/retry";

describe("retry — jitter, cap, deadline, abort (Lumen uplift)", () => {
  it("full jitter stays within [0, min(cap, base*mult^n)] (AWS formula)", async () => {
    const waits: number[] = [];
    const spy = jest.spyOn(global, "setTimeout");
    const fn = jest.fn().mockRejectedValue(new Error("fail"));
    await expect(
      retry(fn, {
        maxAttempts: 6,
        delayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 400,
        jitter: "full",
      }),
    ).rejects.toThrow("fail");
    for (const call of spy.mock.calls) {
      if (typeof call[1] === "number") waits.push(call[1]);
    }
    spy.mockRestore();
    expect(waits).toHaveLength(5);
    const caps = [100, 200, 400, 400, 400];
    waits.forEach((w, i) => {
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(caps[i] as number);
    });
  });

  it("decorrelated jitter never exceeds maxDelayMs and never goes below base", async () => {
    const waits: number[] = [];
    const spy = jest.spyOn(global, "setTimeout");
    const fn = jest.fn().mockRejectedValue(new Error("fail"));
    await expect(
      retry(fn, { maxAttempts: 8, delayMs: 10, jitter: "decorrelated", maxDelayMs: 60 }),
    ).rejects.toThrow("fail");
    for (const call of spy.mock.calls) {
      if (typeof call[1] === "number") waits.push(call[1]);
    }
    spy.mockRestore();
    expect(waits).toHaveLength(7);
    for (const w of waits) {
      expect(w).toBeGreaterThanOrEqual(10);
      expect(w).toBeLessThanOrEqual(60);
    }
  });

  it("maxDelayMs caps unjittered exponential growth", async () => {
    const waits: number[] = [];
    const spy = jest.spyOn(global, "setTimeout");
    const fn = jest.fn().mockRejectedValue(new Error("fail"));
    await expect(
      retry(fn, { maxAttempts: 5, delayMs: 10, backoffMultiplier: 10, maxDelayMs: 50 }),
    ).rejects.toThrow("fail");
    for (const call of spy.mock.calls) {
      if (typeof call[1] === "number") waits.push(call[1]);
    }
    spy.mockRestore();
    expect(waits).toEqual([10, 50, 50, 50]);
  });

  it("shouldRetry=false stops immediately with the original error", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("permanent"));
    await expect(
      retry(fn, { maxAttempts: 5, shouldRetry: (e) => e.message !== "permanent" }),
    ).rejects.toThrow("permanent");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("errors named AbortError are never retried (p-retry semantics)", async () => {
    const abortErr = new Error("stop");
    abortErr.name = "AbortError";
    const fn = jest.fn().mockRejectedValue(abortErr);
    await expect(retry(fn, { maxAttempts: 5 })).rejects.toBe(abortErr);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("signal aborts a pending backoff wait immediately", async () => {
    const controller = new AbortController();
    const fn = jest.fn().mockRejectedValue(new Error("fail"));
    const start = Date.now();
    const p = retry(fn, { maxAttempts: 3, delayMs: 5000, signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
    expect(Date.now() - start).toBeLessThan(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("pre-aborted signal rejects before calling fn", async () => {
    const controller = new AbortController();
    controller.abort();
    const fn = jest.fn();
    await expect(retry(fn, { signal: controller.signal })).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it("maxRetryTimeMs bounds total time (deadline propagation)", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("slow"));
    const start = Date.now();
    await expect(retry(fn, { maxAttempts: 100, delayMs: 40, maxRetryTimeMs: 120 })).rejects.toThrow(
      "slow",
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(fn.mock.calls.length).toBeLessThan(100);
  });

  it("preserves non-Error thrown values on error.cause", async () => {
    const fn = jest.fn().mockRejectedValue("string-reason");
    await expect(retry(fn, { maxAttempts: 1 })).rejects.toMatchObject({
      message: "string-reason",
      cause: "string-reason",
    });
  });

  it("legacy behavior unchanged: default no jitter, exponential waits", async () => {
    const waits: number[] = [];
    const spy = jest.spyOn(global, "setTimeout");
    const fn = jest.fn().mockRejectedValue(new Error("fail"));
    await expect(retry(fn, { maxAttempts: 4, delayMs: 5, backoffMultiplier: 2 })).rejects.toThrow(
      "fail",
    );
    for (const call of spy.mock.calls) {
      if (typeof call[1] === "number") waits.push(call[1]);
    }
    spy.mockRestore();
    expect(waits).toEqual([5, 10, 20]);
  });
});
