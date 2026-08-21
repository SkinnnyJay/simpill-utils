import { createHttpClient } from "../../../src/client/create-http-client";

describe("createHttpClient", () => {
  const mockFetch = jest.fn().mockResolvedValue(new Response("ok", { status: 200 }));

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("get resolves URL with baseUrl", async () => {
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetch: mockFetch });
    await client.get("/users");
    expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/users", expect.any(Object));
  });

  it("post sends body and method", async () => {
    const client = createHttpClient({ fetch: mockFetch });
    await client.post("https://api.example.com/echo", JSON.stringify({ x: 1 }));
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/echo",
      expect.objectContaining({ method: "POST", body: '{"x":1}' }),
    );
  });

  it("delete does not send body", async () => {
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetch: mockFetch });
    await client.delete("/resource/1");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/resource/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("put and patch send body", async () => {
    const client = createHttpClient({ fetch: mockFetch });
    await client.put("https://api.example.com/r", "body");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/r",
      expect.objectContaining({ method: "PUT", body: "body" }),
    );
    mockFetch.mockClear();
    await client.patch("https://api.example.com/r", "patch-body");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/r",
      expect.objectContaining({ method: "PATCH", body: "patch-body" }),
    );
  });

  it("uses defaultRetry when provided", async () => {
    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      defaultRetry: { maxAttempts: 2, delayMs: 0 },
      fetch: mockFetch,
    });
    await client.get("/users");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("uses defaultTimeoutMs with fetchWithTimeout when no defaultRetry", async () => {
    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      defaultTimeoutMs: 10000,
      fetch: mockFetch,
    });
    await client.get("/users");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

describe("createHttpClient (uplift)", () => {
  it("applies the timeout per attempt when a retry policy is set (previously timeouts were dropped)", async () => {
    const hangingFetch = jest.fn().mockImplementation(() => new Promise<Response>(() => {}));
    const client = createHttpClient({
      defaultRetry: { maxAttempts: 2, delayMs: 0 },
      defaultTimeoutMs: 25,
      fetch: hangingFetch,
    });
    await expect(client.get("https://api.example.com/slow")).rejects.toThrow(
      /timed out after 25ms/,
    );
    expect(hangingFetch).toHaveBeenCalledTimes(2);
  });

  it("passes absolute URLs through untouched when baseUrl is set", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetch: mockFetch });
    await client.get("https://other.example.org/health");
    expect(mockFetch).toHaveBeenCalledWith("https://other.example.org/health", expect.any(Object));
  });

  it("supports a per-request retry policy override", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const client = createHttpClient({ fetch: mockFetch });
    const res = await client.get("https://api.example.com/x", {
      retry: { maxAttempts: 2, delayMs: 0 },
    });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("sends HEAD requests", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetch: mockFetch });
    await client.head("/ping");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/ping",
      expect.objectContaining({ method: "HEAD" }),
    );
  });

  it("merges defaultHeaders with per-request headers (request wins)", async () => {
    const mockFetch = jest.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const client = createHttpClient({
      defaultHeaders: { "X-App": "simpill", "X-Env": "test" },
      fetch: mockFetch,
    });
    await client.get("https://api.example.com/x", { headers: { "X-Env": "prod" } });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/x",
      expect.objectContaining({ headers: { "X-App": "simpill", "X-Env": "prod" } }),
    );
  });
});
