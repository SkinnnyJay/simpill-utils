import { fetchWithTimeout } from "../../../src/client/fetch-with-timeout";

describe("fetchWithTimeout", () => {
  it("returns response when fetch resolves before timeout", async () => {
    const res = new Response("ok", { status: 200 });
    const mockFetch = jest.fn().mockResolvedValue(res);
    const out = await fetchWithTimeout("https://example.com", { timeoutMs: 5000 }, mockFetch);
    expect(out).toBe(res);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("throws when timeout is exceeded", async () => {
    const mockFetch = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(new Response()), 200)),
      );
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: 10 }, mockFetch),
    ).rejects.toThrow(/timed out/);
  });

  it("passes custom headers and signal", async () => {
    const res = new Response("ok", { status: 200 });
    const mockFetch = jest.fn().mockResolvedValue(res);
    const ac = new AbortController();
    await fetchWithTimeout(
      "https://example.com",
      {
        timeoutMs: 1000,
        headers: { "X-Custom": "v" },
        signal: ac.signal,
      },
      mockFetch,
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: { "X-Custom": "v" },
        signal: expect.any(AbortSignal),
      }),
    );
  });
});

describe("fetchWithTimeout (uplift)", () => {
  it("throws a typed TimeoutError carrying timeoutMs", async () => {
    const mockFetch = jest.fn().mockImplementation(() => new Promise<Response>(() => {}));
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: 20 }, mockFetch),
    ).rejects.toMatchObject({ name: "TimeoutError", timeoutMs: 20 });
  });

  it("aborts the underlying request at the deadline with the timeout error as reason", async () => {
    let seenSignal: AbortSignal | undefined;
    const mockFetch = jest.fn().mockImplementation((_input, init?: RequestInit) => {
      seenSignal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    });
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: 20 }, mockFetch),
    ).rejects.toThrow(/timed out/);
    expect(seenSignal?.aborted).toBe(true);
    expect((seenSignal?.reason as Error).name).toBe("TimeoutError");
  });

  it("propagates the caller's abort reason to the request signal", async () => {
    let seenSignal: AbortSignal | undefined;
    const mockFetch = jest.fn().mockImplementation((_input, init?: RequestInit) => {
      seenSignal = init?.signal ?? undefined;
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), {
          once: true,
        });
      });
    });
    const ac = new AbortController();
    const reason = new Error("caller says stop");
    const pending = fetchWithTimeout(
      "https://example.com",
      { timeoutMs: 5000, signal: ac.signal },
      mockFetch,
    );
    ac.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(seenSignal?.reason as Error).toBe(reason);
  });
});
