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
