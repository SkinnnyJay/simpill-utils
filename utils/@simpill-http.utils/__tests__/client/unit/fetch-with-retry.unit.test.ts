import { fetchWithRetry } from "../../../src/client/fetch-with-retry";

describe("fetchWithRetry", () => {
  it("returns response when status is not retryable", async () => {
    const res = new Response("ok", { status: 200 });
    const mockFetch = jest.fn().mockResolvedValue(res);
    const out = await fetchWithRetry("https://example.com", undefined, {
      retry: { maxAttempts: 3 },
      fetch: mockFetch,
    });
    expect(out).toBe(res);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable status and returns when success", async () => {
    const okRes = new Response("ok", { status: 200 });
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(okRes);
    const out = await fetchWithRetry("https://example.com", undefined, {
      retry: { maxAttempts: 3, delayMs: 0 },
      fetch: mockFetch,
    });
    expect(out).toBe(okRes);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws after maxAttempts on retryable status", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response("", { status: 503 }));
    await expect(
      fetchWithRetry("https://example.com", undefined, {
        retry: { maxAttempts: 2, delayMs: 0 },
        fetch: mockFetch,
      }),
    ).rejects.toThrow(/Retryable status: 503/);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("uses custom retryableStatuses when provided", async () => {
    const res = new Response("ok", { status: 200 });
    const mockFetch = jest.fn().mockResolvedValue(res);
    const customRetryable = jest.fn().mockReturnValue(false);
    await fetchWithRetry("https://example.com", undefined, {
      retry: { maxAttempts: 3, retryableStatuses: customRetryable },
      fetch: mockFetch,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(customRetryable).toHaveBeenCalledWith(200);
  });

  it("stops retrying when retryableErrors returns false", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response("", { status: 503 }));
    const retryableErrors = jest.fn().mockReturnValue(false);
    await expect(
      fetchWithRetry("https://example.com", undefined, {
        retry: { maxAttempts: 3, delayMs: 0, retryableErrors },
        fetch: mockFetch,
      }),
    ).rejects.toThrow(/Retryable status/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(retryableErrors).toHaveBeenCalled();
  });
});

describe("fetchWithRetry (uplift)", () => {
  it("honors Retry-After (capped by maxRetryAfterMs) between attempts", async () => {
    const okRes = new Response("ok", { status: 200 });
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(okRes);
    const started = Date.now();
    const out = await fetchWithRetry("https://example.com", undefined, {
      retry: { maxAttempts: 2, delayMs: 0, maxRetryAfterMs: 80 },
      fetch: mockFetch,
    });
    const elapsed = Date.now() - started;
    expect(out).toBe(okRes);
    expect(elapsed).toBeGreaterThanOrEqual(70);
    expect(elapsed).toBeLessThan(900);
  });

  it("can disable Retry-After handling", async () => {
    const okRes = new Response("ok", { status: 200 });
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(okRes);
    const started = Date.now();
    await fetchWithRetry("https://example.com", undefined, {
      retry: { maxAttempts: 2, delayMs: 0, respectRetryAfter: false },
      fetch: mockFetch,
    });
    expect(Date.now() - started).toBeLessThan(500);
  });

  it("does not start a first attempt on an already-aborted signal", async () => {
    const mockFetch = jest.fn();
    const ac = new AbortController();
    const reason = new Error("user cancelled");
    ac.abort(reason);
    await expect(
      fetchWithRetry(
        "https://example.com",
        { signal: ac.signal },
        {
          retry: { maxAttempts: 3 },
          fetch: mockFetch,
        },
      ),
    ).rejects.toBe(reason);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("stops retrying when the signal aborts mid-sequence", async () => {
    const ac = new AbortController();
    const reason = new Error("stop now");
    const mockFetch = jest.fn().mockImplementation(() => {
      ac.abort(reason);
      return Promise.resolve(new Response("", { status: 503 }));
    });
    await expect(
      fetchWithRetry(
        "https://example.com",
        { signal: ac.signal },
        {
          retry: { maxAttempts: 5, delayMs: 50 },
          fetch: mockFetch,
        },
      ),
    ).rejects.toBe(reason);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("cancels the body of discarded retryable responses but keeps the final one intact", async () => {
    const cancelledBodies: number[] = [];
    const makeRes = (idx: number) =>
      ({
        status: 503,
        headers: new Headers(),
        body: {
          cancel: () => {
            cancelledBodies.push(idx);
            return Promise.resolve();
          },
        },
      }) as unknown as Response;
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(makeRes(1))
      .mockResolvedValueOnce(makeRes(2))
      .mockResolvedValueOnce(makeRes(3));
    await expect(
      fetchWithRetry("https://example.com", undefined, {
        retry: { maxAttempts: 3, delayMs: 0 },
        fetch: mockFetch,
      }),
    ).rejects.toMatchObject({ status: 503 });
    expect(cancelledBodies).toEqual([1, 2]);
  });

  it("throws RetryableStatusError carrying status and the final Response", async () => {
    const finalRes = new Response("busy", { status: 503 });
    const mockFetch = jest.fn().mockResolvedValue(finalRes);
    await expect(
      fetchWithRetry("https://example.com", undefined, {
        retry: { maxAttempts: 1 },
        fetch: mockFetch,
      }),
    ).rejects.toMatchObject({
      name: "RetryableStatusError",
      status: 503,
      response: finalRes,
    });
  });

  it("respects the retryMethods idempotency guard", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response("", { status: 503 }));
    await expect(
      fetchWithRetry(
        "https://example.com",
        { method: "POST", body: "x" },
        { retry: { maxAttempts: 3, delayMs: 0, retryMethods: ["GET", "PUT"] }, fetch: mockFetch },
      ),
    ).rejects.toThrow(/Retryable status: 503/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("never retries requests with a ReadableStream body", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response("", { status: 503 }));
    const body = new ReadableStream();
    await expect(
      fetchWithRetry(
        "https://example.com",
        { method: "POST", body, duplex: "half" } as RequestInit,
        { retry: { maxAttempts: 3, delayMs: 0 }, fetch: mockFetch },
      ),
    ).rejects.toThrow(/Retryable status: 503/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("applies a per-attempt timeout inside the retry loop", async () => {
    const mockFetch = jest.fn().mockImplementation(() => new Promise<Response>(() => {}));
    await expect(
      fetchWithRetry("https://example.com", undefined, {
        retry: { maxAttempts: 2, delayMs: 0, timeoutMs: 25 },
        fetch: mockFetch,
      }),
    ).rejects.toThrow(/timed out after 25ms/);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("uses full jitter when enabled", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    const okRes = new Response("ok", { status: 200 });
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(okRes);
    const out = await fetchWithRetry("https://example.com", undefined, {
      retry: { maxAttempts: 2, delayMs: 5000, jitter: true },
      fetch: mockFetch,
    });
    expect(out).toBe(okRes);
    expect(randomSpy).toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});
