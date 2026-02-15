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
