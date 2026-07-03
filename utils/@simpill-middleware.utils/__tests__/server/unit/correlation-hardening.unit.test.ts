import { getRequestContext } from "@simpill/request-context.utils";
import { createCorrelationMiddleware } from "../../../src/server/correlation-middleware";

async function run(
  headers: unknown,
  opts?: Parameters<typeof createCorrelationMiddleware>[0],
): Promise<{ ctx: Record<string, unknown> | undefined; setCalls: [string, string][] }> {
  const setCalls: [string, string][] = [];
  let ctx: Record<string, unknown> | undefined;
  const middleware = createCorrelationMiddleware(opts);
  await middleware(
    { headers: headers as never },
    {
      setHeader: (n: string, v: string) => {
        setCalls.push([n, v]);
      },
    },
    () => {
      ctx = getRequestContext() as Record<string, unknown> | undefined;
    },
  );
  return { ctx, setCalls };
}

describe("createCorrelationMiddleware — incoming id validation", () => {
  it("discards oversized incoming ids instead of reflecting them (16KB id)", async () => {
    const evil = "x".repeat(16384);
    const { ctx, setCalls } = await run({ "x-request-id": evil });
    expect(ctx?.requestId).not.toBe(evil);
    expect((ctx?.requestId as string).length).toBeLessThanOrEqual(128);
    for (const [, v] of setCalls) expect(v).not.toBe(evil);
  });

  it("discards ids containing whitespace/log-delimiter characters (log injection)", async () => {
    const evil = "abc level=error user=admin msg=fake";
    const { ctx, setCalls } = await run({ "x-request-id": evil });
    expect(ctx?.requestId).not.toBe(evil);
    for (const [, v] of setCalls) expect(v).not.toContain(" ");
  });

  it("discards ids containing control characters", async () => {
    const evil = "abc\r\nset-cookie: pwned";
    const { ctx } = await run({ "x-request-id": evil });
    expect(ctx?.requestId).not.toBe(evil);
    expect(ctx?.requestId).not.toContain("\r");
  });

  it("accepts common well-formed id shapes (UUID, ULID, base62, base64url)", async () => {
    const good = [
      "7c4a8d09-ca38-4aa6-8b8e-1c3d5e84b2f0",
      "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "aZ09xY42",
      "aGVsbG8td29ybGQ_-~.",
    ];
    for (const id of good) {
      const { ctx } = await run({ "x-request-id": id });
      expect(ctx?.requestId).toBe(id);
    }
  });

  it("the response echoes the GENERATED id when the incoming one was rejected", async () => {
    const { ctx, setCalls } = await run({ "x-request-id": "bad id" });
    const echoed = setCalls.find(([n]) => n === "x-request-id");
    expect(echoed?.[1]).toBe(ctx?.requestId);
  });

  it("trustIncomingIds:false always generates fresh ids even for valid input", async () => {
    const { ctx } = await run({ "x-request-id": "valid-incoming-id" }, { trustIncomingIds: false });
    expect(ctx?.requestId).not.toBe("valid-incoming-id");
  });

  it("honors a custom isValidId", async () => {
    const { ctx } = await run({ "x-request-id": "ZZZ" }, { isValidId: (id) => id.startsWith("Z") });
    expect(ctx?.requestId).toBe("ZZZ");
    const rejected = await run(
      { "x-request-id": "AAA" },
      { isValidId: (id) => id.startsWith("Z") },
    );
    expect(rejected.ctx?.requestId).not.toBe("AAA");
  });
});

describe("createCorrelationMiddleware — W3C traceparent", () => {
  const TP = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

  it("uses traceparent trace-id and span-id when the trace-id header is absent", async () => {
    const { ctx, setCalls } = await run({ traceparent: TP });
    expect(ctx?.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    expect(ctx?.spanId).toBe("00f067aa0ba902b7");
    const echoedTrace = setCalls.find(([n]) => n === "x-trace-id");
    expect(echoedTrace?.[1]).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("prefers an explicit x-trace-id header over traceparent (backward compatibility)", async () => {
    const { ctx } = await run({ "x-trace-id": "explicit-trace", traceparent: TP });
    expect(ctx?.traceId).toBe("explicit-trace");
    expect(ctx?.spanId).toBeUndefined();
  });

  it("ignores all-zero trace-id traceparent per spec and falls back to requestId", async () => {
    const { ctx } = await run({
      traceparent: "00-00000000000000000000000000000000-00f067aa0ba902b7-01",
    });
    expect(ctx?.traceId).toBe(ctx?.requestId);
  });

  it("ignores malformed traceparent values", async () => {
    for (const bad of [
      "not-a-traceparent",
      "00-4BF92F3577B34DA6A3CE929D0E0E4736-00f067aa0ba902b7-01",
      "ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      "00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01",
    ]) {
      const { ctx } = await run({ traceparent: bad });
      expect(ctx?.traceId).toBe(ctx?.requestId);
    }
  });

  it("useTraceparent:false ignores the header entirely", async () => {
    const { ctx } = await run({ traceparent: TP }, { useTraceparent: false });
    expect(ctx?.traceId).toBe(ctx?.requestId);
  });
});

describe("createCorrelationMiddleware — Edge (Fetch Headers) support", () => {
  it("reads ids from a Fetch-API Headers instance", async () => {
    const headers = new Headers({ "X-Request-Id": "edge-id-123" });
    const { ctx } = await run(headers);
    expect(ctx?.requestId).toBe("edge-id-123");
  });

  it("reads traceparent from a Fetch-API Headers instance", async () => {
    const headers = new Headers({
      traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    });
    const { ctx } = await run(headers);
    expect(ctx?.traceId).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
  });
});

describe("createCorrelationMiddleware — response header control", () => {
  it("setResponseHeaders:false suppresses both headers", async () => {
    const { setCalls } = await run({});
    expect(setCalls.length).toBe(2);
    const suppressed = await run({}, { setResponseHeaders: false });
    expect(suppressed.setCalls.length).toBe(0);
  });

  it("still uses the first element of array header values (Node multi-header shape)", async () => {
    const { ctx } = await run({ "x-request-id": ["first-id", "second-id"] });
    expect(ctx?.requestId).toBe("first-id");
  });
});
