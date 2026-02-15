/**
 * @file withRequestContext unit tests
 */

import { getRequestContext, withRequestContext } from "../../../src/server/with-request-context";

describe("withRequestContext", () => {
  it("runs handler with context and propagates requestId/traceId", async () => {
    const headers = new Headers();
    headers.set("x-request-id", "req-123");
    headers.set("x-trace-id", "trace-456");
    const result = await withRequestContext(
      async () => {
        const ctx = getRequestContext();
        return ctx?.requestId ?? "missing";
      },
      { getHeaders: () => headers }
    );
    expect(result).toBe("req-123");
  });

  it("generates ids when headers missing", async () => {
    const result = await withRequestContext(async () => {
      const ctx = getRequestContext();
      return { requestId: ctx?.requestId, traceId: ctx?.traceId };
    });
    expect(result.requestId).toBeDefined();
    expect(result.traceId).toBeDefined();
    expect(result.requestId).toBe(result.traceId);
  });

  it("uses custom header names when provided", async () => {
    const headers = new Headers();
    headers.set("x-request-id", "custom-req");
    headers.set("x-trace-id", "custom-trace");
    const result = await withRequestContext(async () => getRequestContext()?.requestId ?? "", {
      getHeaders: () => headers,
    });
    expect(result).toBe("custom-req");
  });
});
