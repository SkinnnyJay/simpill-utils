/** @file withCorrelation uplift: id validation, traceparent, Edge-safe */
import { withCorrelation } from "../../../src/client/middleware-helpers";
import { CORRELATION_ID_PATTERN } from "../../../src/shared/ids";

const req = (headers: Record<string, string>) => ({ headers: new Headers(headers) });

describe("incoming id validation (anti-reflection)", () => {
  it("regenerates 16KB request ids instead of reflecting them", () => {
    const out = withCorrelation(req({ "x-request-id": "A".repeat(16384) }));
    expect(out["x-request-id"].length).toBeLessThanOrEqual(128);
    expect(CORRELATION_ID_PATTERN.test(out["x-request-id"])).toBe(true);
  });

  it("regenerates log-injection payloads", () => {
    const out = withCorrelation({
      headers: { get: (n: string) => (n === "x-request-id" ? "evil\nX-Injected: 1" : null) },
    });
    expect(out["x-request-id"]).not.toContain("\n");
    expect(CORRELATION_ID_PATTERN.test(out["x-request-id"])).toBe(true);
  });

  it("valid incoming ids pass through unchanged (original tests unaffected)", () => {
    const out = withCorrelation(req({ "x-request-id": "r1", "x-trace-id": "t1" }));
    expect(out["x-request-id"]).toBe("r1");
    expect(out["x-trace-id"]).toBe("t1");
  });

  it("trustIncomingIds: true restores verbatim reflection for trusted internal hops", () => {
    const hostile = "A".repeat(500);
    const out = withCorrelation(req({ "x-request-id": hostile }), { trustIncomingIds: true });
    expect(out["x-request-id"]).toBe(hostile);
  });

  it("custom idPattern honored; global-flag lastIndex state is neutralized", () => {
    const pattern = /^[0-9]{1,8}$/g; // deliberately global — .test() is stateful
    const a = withCorrelation(req({ "x-request-id": "12345" }), { idPattern: pattern });
    const b = withCorrelation(req({ "x-request-id": "12345" }), { idPattern: pattern });
    expect(a["x-request-id"]).toBe("12345");
    expect(b["x-request-id"]).toBe("12345"); // would regenerate if lastIndex leaked
    const c = withCorrelation(req({ "x-request-id": "abc" }), { idPattern: pattern });
    expect(c["x-request-id"]).not.toBe("abc");
  });
});

describe("W3C traceparent fallback", () => {
  const TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";

  it("uses traceparent trace-id when no trace-id header is present", () => {
    const out = withCorrelation(req({ traceparent: `00-${TRACE}-00f067aa0ba902b7-01` }));
    expect(out["x-trace-id"]).toBe(TRACE);
  });

  it("explicit x-trace-id wins over traceparent", () => {
    const out = withCorrelation(
      req({ "x-trace-id": "t1", traceparent: `00-${TRACE}-00f067aa0ba902b7-01` })
    );
    expect(out["x-trace-id"]).toBe("t1");
  });

  it("invalid traceparent is ignored, falls back to requestId", () => {
    const out = withCorrelation(
      req({ "x-request-id": "r1", traceparent: `00-${"0".repeat(32)}-00f067aa0ba902b7-01` })
    );
    expect(out["x-trace-id"]).toBe("r1");
  });

  it("readTraceparent: false disables the fallback", () => {
    const out = withCorrelation(
      req({ "x-request-id": "r1", traceparent: `00-${TRACE}-00f067aa0ba902b7-01` }),
      { readTraceparent: false }
    );
    expect(out["x-trace-id"]).toBe("r1");
  });
});
