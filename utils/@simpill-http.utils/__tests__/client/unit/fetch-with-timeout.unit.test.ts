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
