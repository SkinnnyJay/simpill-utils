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

  it("should use provided init.signal when given", async () => {
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
      {
        timeoutMs: TIMEOUT_MS_1000,
        fetcher,
      }
    );
    expect(receivedSignal).toBe(controller.signal);
  });
});
