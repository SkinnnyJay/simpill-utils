/**
 * @file Fetch Helpers Extended Unit Tests
 * @description Abort-awareness, status retries, backoff/jitter, timeout with
 * user signals, composeSignal opt-in, and composeSignals itself.
 */

import { fetchWithRetry, fetchWithTimeout } from "../../../src/server/fetch-helpers";
import { composeSignals } from "../../../src/server/signal";
import { ApiTimeoutError } from "../../../src/shared/errors";

const ok = () => new Response("ok", { status: 200 });

describe("fetchWithRetry abort-awareness", () => {
  it("should not retry when the caller's signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = jest.fn().mockRejectedValue(new Error("network"));
    await expect(
      fetchWithRetry(
        "https://x",
        { signal: controller.signal },
        { maxRetries: 3, delayMs: 1, fetcher }
      )
    ).rejects.toBeDefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("should stop retrying when the fetch rejects with an AbortError (user abort mid-flight)", async () => {
    // v1 burned every retry + delay on an abort: 4 attempts here.
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";
    const fetcher = jest.fn().mockRejectedValue(abortErr);
    await expect(
      fetchWithRetry("https://x", undefined, { maxRetries: 3, delayMs: 1, fetcher })
    ).rejects.toThrow("aborted");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should reject a pending retry delay when the signal aborts mid-wait", async () => {
    const controller = new AbortController();
    const fetcher = jest.fn().mockRejectedValue(new Error("network"));
    const p = fetchWithRetry(
      "https://x",
      { signal: controller.signal },
      { maxRetries: 3, delayMs: 60_000, fetcher }
    );
    const rejection = expect(p).rejects.toBeDefined();
    setTimeout(() => controller.abort(), 20);
    await rejection;
    expect(fetcher).toHaveBeenCalledTimes(1); // never slept through 60s
  });
});

describe("fetchWithRetry policy passthrough (status retries via http.utils)", () => {
  it("should retry matching statuses and return the eventual success", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(new Response("bad", { status: 503 }))
      .mockResolvedValueOnce(new Response("bad", { status: 502 }))
      .mockResolvedValueOnce(ok());
    const res = await fetchWithRetry("https://x", undefined, {
      maxRetries: 3,
      delayMs: 1,
      policy: { retryableStatuses: (s) => [502, 503, 504].includes(s) },
      fetcher,
    });
    expect(res.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("should throw when retries are exhausted on a retryable status (http.utils semantics)", async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response("bad", { status: 503 }));
    await expect(
      fetchWithRetry("https://x", undefined, {
        maxRetries: 2,
        delayMs: 1,
        policy: { retryableStatuses: (s) => s === 503 },
        fetcher,
      })
    ).rejects.toBeDefined();
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("should not retry statuses by default (v1 compat)", async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response("bad", { status: 503 }));
    const res = await fetchWithRetry("https://x", undefined, {
      maxRetries: 3,
      delayMs: 1,
      fetcher,
    });
    expect(res.status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("fetchWithRetry policy passthrough (backoff and jitter via http.utils)", () => {
  it("should grow delays by backoffMultiplier", async () => {
    jest.useFakeTimers();
    try {
      const fetcher = jest
        .fn()
        .mockRejectedValueOnce(new Error("e1"))
        .mockRejectedValueOnce(new Error("e2"))
        .mockResolvedValueOnce(ok());
      const p = fetchWithRetry("https://x", undefined, {
        maxRetries: 2,
        delayMs: 100,
        policy: { backoffMultiplier: 2 },
        fetcher,
      });
      // attempt 1 fails -> delay 100
      await jest.advanceTimersByTimeAsync(100);
      expect(fetcher).toHaveBeenCalledTimes(2);
      // attempt 2 fails -> delay 200
      await jest.advanceTimersByTimeAsync(199);
      expect(fetcher).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1);
      expect(fetcher).toHaveBeenCalledTimes(3);
      await expect(p).resolves.toBeInstanceOf(Response);
    } finally {
      jest.useRealTimers();
    }
  });

  it("should apply full jitter within (0, baseDelay]", async () => {
    jest.useFakeTimers();
    try {
      const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);
      const fetcher = jest.fn().mockRejectedValueOnce(new Error("e")).mockResolvedValueOnce(ok());
      const p = fetchWithRetry("https://x", undefined, {
        maxRetries: 1,
        delayMs: 100,
        policy: { jitter: true },
        fetcher,
      });
      await jest.advanceTimersByTimeAsync(50); // 0.5 * 100
      expect(fetcher).toHaveBeenCalledTimes(2);
      await expect(p).resolves.toBeInstanceOf(Response);
      randomSpy.mockRestore();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("fetchWithTimeout with a user signal", () => {
  it("should ENFORCE the timeout even when init.signal is provided (v1 silently disabled it)", async () => {
    const controller = new AbortController();
    const fetcher = jest.fn().mockImplementation(() => new Promise<Response>(() => {}));
    const start = Date.now();
    const err = await fetchWithTimeout(
      "https://x",
      { signal: controller.signal },
      { timeoutMs: 50, fetcher }
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiTimeoutError);
    expect((err as Error).name).toBe("TimeoutError");
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it("should keep passing the user's signal through identically when composeSignal is false", async () => {
    const controller = new AbortController();
    let received: AbortSignal | undefined;
    const fetcher = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      received = init?.signal as AbortSignal;
      return Promise.resolve(ok());
    });
    await fetchWithTimeout(
      "https://x",
      { signal: controller.signal },
      { timeoutMs: 1000, fetcher, composeSignal: false }
    );
    expect(received).toBe(controller.signal);
  });

  it("should compose signals when composeSignal is true so the timeout also cancels the request", async () => {
    const controller = new AbortController();
    let received: AbortSignal | undefined;
    const fetcher = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      received = init?.signal as AbortSignal;
      return new Promise<Response>((_, reject) => {
        received?.addEventListener("abort", () => reject(received?.reason), { once: true });
      });
    });
    const err = await fetchWithTimeout(
      "https://x",
      { signal: controller.signal },
      { timeoutMs: 30, fetcher, composeSignal: true }
    ).catch((e: unknown) => e);
    expect(received).not.toBe(controller.signal); // derived composite
    expect(err).toBeInstanceOf(ApiTimeoutError); // reason propagated through abort
  });

  it("should abort with an ApiTimeoutError reason when no user signal is given", async () => {
    const fetcher = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal;
      return new Promise<Response>((_, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });
    });
    const err = await fetchWithTimeout("https://x", undefined, { timeoutMs: 30, fetcher }).catch(
      (e: unknown) => e
    );
    expect(err).toBeInstanceOf(ApiTimeoutError);
    expect((err as ApiTimeoutError).timeoutMs).toBe(30);
  });
});

describe("composeSignals", () => {
  it("should return undefined for no signals and identity for one", () => {
    const c = new AbortController();
    expect(composeSignals()).toBeUndefined();
    expect(composeSignals(undefined, null)).toBeUndefined();
    expect(composeSignals(c.signal)).toBe(c.signal);
    expect(composeSignals(undefined, c.signal, null)).toBe(c.signal);
  });

  it("should abort when any input aborts, propagating the reason", () => {
    const a = new AbortController();
    const b = new AbortController();
    const composed = composeSignals(a.signal, b.signal);
    expect(composed?.aborted).toBe(false);
    const reason = new Error("stop");
    b.abort(reason);
    expect(composed?.aborted).toBe(true);
    expect(composed?.reason).toBe(reason);
  });

  it("should be immediately aborted when an input is already aborted", () => {
    const a = new AbortController();
    a.abort();
    const b = new AbortController();
    const composed = composeSignals(a.signal, b.signal);
    expect(composed?.aborted).toBe(true);
  });
});
