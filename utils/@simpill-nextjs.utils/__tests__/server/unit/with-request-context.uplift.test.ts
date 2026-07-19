/** @file withRequestContext uplift: validation + traceparent parity with withCorrelation */
import { getRequestContext, withRequestContext } from "../../../src/server/with-request-context";

const headersOf = (entries: Record<string, string>) => {
  const h = new Headers();
  for (const [k, v] of Object.entries(entries)) {
    h.set(k, v);
  }
  return h;
};

describe("incoming id validation", () => {
  it("hostile request ids are regenerated before entering request context (and logs)", async () => {
    const ctx = await withRequestContext(async () => getRequestContext(), {
      getHeaders: () => headersOf({ "x-request-id": "A".repeat(16384) }),
    });
    expect(ctx?.requestId).toBeDefined();
    expect(ctx?.requestId?.length ?? 0).toBeLessThanOrEqual(128);
  });

  it("generated fallback keeps requestId === traceId (pinned original semantics)", async () => {
    const ctx = await withRequestContext(async () => getRequestContext(), {
      getHeaders: () => headersOf({ "x-request-id": "bad id with spaces" }),
    });
    expect(ctx?.requestId).toBe(ctx?.traceId);
  });

  it("traceparent trace-id joins distributed traces when no x-trace-id present", async () => {
    const TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";
    const ctx = await withRequestContext(async () => getRequestContext(), {
      getHeaders: () =>
        headersOf({ "x-request-id": "r1", traceparent: `00-${TRACE}-00f067aa0ba902b7-01` }),
    });
    expect(ctx?.requestId).toBe("r1");
    expect(ctx?.traceId).toBe(TRACE);
  });

  it("async getHeaders (Next 15+ headers()) still supported", async () => {
    const ctx = await withRequestContext(async () => getRequestContext(), {
      getHeaders: async () => headersOf({ "x-request-id": "async-req" }),
    });
    expect(ctx?.requestId).toBe("async-req");
  });
});
