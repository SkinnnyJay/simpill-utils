/**
 * @file Fetch Helpers Unit Tests
 * @description Tests for fetchWithRetry and fetchWithTimeout
 */

import { fetchWithRetry, fetchWithTimeout } from "../../../src/server/fetch-helpers";
import {
  TIMEOUT_MS_1000,
  TIMEOUT_MS_5000,
  VALUE_0,
  VALUE_50,
} from "../../../src/shared/internal-constants";

describe("fetchWithRetry", () => {
  it("should return response on first success", async () => {
    const res = new Response('{"ok":true}', { status: 200 });
    const fetcher = jest.fn().mockResolvedValue(res);
    const result = await fetchWithRetry("https://example.com", undefined, {
      maxRetries: 2,
      delayMs: 1,
      fetcher,
    });
    expect(result).toBe(res);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and succeed", async () => {
    const res = new Response("ok", { status: 200 });
    const fetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(res);
    const result = await fetchWithRetry("https://example.com", undefined, {
      maxRetries: 3,
      delayMs: 1,
      fetcher,
    });
    expect(result).toBe(res);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("should throw after exhausting retries", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("network error"));
    await expect(
      fetchWithRetry("https://example.com", undefined, {
        maxRetries: 2,
        delayMs: 1,
        fetcher,
      })
    ).rejects.toThrow("network error");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("should not delay when delayMs is 0", async () => {
    const res = new Response("ok", { status: 200 });
    const fetcher = jest.fn().mockRejectedValueOnce(new Error("e")).mockResolvedValueOnce(res);
    const result = await fetchWithRetry("https://example.com", undefined, {
      maxRetries: 1,
      delayMs: VALUE_0,
      fetcher,
    });
    expect(result).toBe(res);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("fetchWithTimeout", () => {
  it("should return response when fetcher resolves before timeout", async () => {
    const res = new Response("ok", { status: 200 });
    const fetcher = jest.fn().mockResolvedValue(res);
    const result = await fetchWithTimeout("https://example.com", undefined, {
      timeoutMs: TIMEOUT_MS_5000,
      fetcher,
    });
    expect(result).toBe(res);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("should abort when timeout is exceeded", async () => {
    const fetcher = jest.fn().mockImplementation(
      () =>
        new Promise<Response>((_, reject) => {
          setTimeout(() => reject(new Error("timeout")), 200);
        })
    );
    await expect(
      fetchWithTimeout("https://example.com", undefined, {
        timeoutMs: VALUE_50,
        fetcher,
      })
    ).rejects.toThrow();
  });

  it("should pass init and signal to fetcher", async () => {
    let receivedInit: RequestInit | undefined;
    const res = new Response("ok", { status: 200 });
    const fetcher = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      receivedInit = init;
      return Promise.resolve(res);
    });
    await fetchWithTimeout(
      "https://example.com",
      { method: "POST" },
      {
        timeoutMs: TIMEOUT_MS_1000,
        fetcher,
      }
    );
    expect(receivedInit?.method).toBe("POST");
    expect(receivedInit?.signal).toBeDefined();
  });

  // Previously this asserted `receivedSignal === controller.signal`, which enshrined a bug:
  // choosing the caller's signal meant the timeout controller was never attached, so passing a
  // cancellation signal silently disabled the timeout entirely. The contract is that BOTH work.
  it("should honour a caller-provided signal", async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const res = new Response("ok", { status: 200 });
    const fetcher = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      receivedSignal = init?.signal as AbortSignal;
      return Promise.resolve(res);
    });

    await fetchWithTimeout(
      "https://example.com",
      { signal: controller.signal },
      { timeoutMs: TIMEOUT_MS_1000, fetcher }
    );

    expect(receivedSignal).toBeDefined();
    expect(receivedSignal?.aborted).toBe(false);
    controller.abort();
    expect(receivedSignal?.aborted).toBe(true);
  });

  it("should still time out when a caller signal is supplied", async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const fetcher = jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      receivedSignal = init?.signal as AbortSignal;
      // Never settles: only the timeout can abort this.
      return new Promise<Response>(() => undefined);
    });

    // The call also rejects with ApiTimeoutError once the timer fires; this test is
    // about the SIGNAL, so swallow the rejection rather than leave it unhandled.
    const pending = fetchWithTimeout(
      "https://example.com",
      { signal: controller.signal },
      { timeoutMs: 10, fetcher }
    );

    await expect(pending).rejects.toThrow(/timed out/i);
    // Composed with the caller's signal, so the timeout actually cancels the request
    // instead of leaving it running after the caller has given up.
    expect(receivedSignal?.aborted).toBe(true);
  });
});
