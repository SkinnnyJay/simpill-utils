import type { RequestContext } from "../../../src/shared";

describe("RequestContext type", () => {
  it("allows standard fields", () => {
    const ctx: RequestContext = {
      requestId: "req-1",
      traceId: "trace-1",
      spanId: "span-1",
      userId: "user-1",
      sessionId: "sess-1",
      tenantId: "tenant-1",
    };
    expect(ctx.requestId).toBe("req-1");
    expect(ctx.traceId).toBe("trace-1");
  });

  it("allows index signature for custom fields", () => {
    const ctx: RequestContext = {
      requestId: "req-1",
      customKey: "customValue",
    };
    expect(ctx.customKey).toBe("customValue");
  });
});
