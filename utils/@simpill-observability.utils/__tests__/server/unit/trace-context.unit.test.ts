import {
  formatTraceparent,
  generateSpanId,
  generateTraceId,
  isValidSpanId,
  isValidTraceId,
  parseTraceparent,
  TRACE_FLAG_RANDOM_TRACE_ID,
  TRACE_FLAG_SAMPLED,
  traceContextFromHeaders,
} from "../../../src/server/trace-context";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const PARENT_ID = "00f067aa0ba902b7";
const VALID = `00-${TRACE_ID}-${PARENT_ID}-01`;

describe("parseTraceparent", () => {
  it("parses the spec's sampled example", () => {
    expect(parseTraceparent(VALID)).toEqual({
      version: 0,
      traceId: TRACE_ID,
      parentId: PARENT_ID,
      traceFlags: 0x01,
      sampled: true,
      randomTraceId: false,
    });
  });

  it("parses the spec's not-sampled example", () => {
    const parsed = parseTraceparent(`00-${TRACE_ID}-${PARENT_ID}-00`);
    expect(parsed?.sampled).toBe(false);
    expect(parsed?.traceFlags).toBe(0);
  });

  it("exposes the Level 2 random-trace-id flag", () => {
    const parsed = parseTraceparent(`00-${TRACE_ID}-${PARENT_ID}-03`);
    expect(parsed?.sampled).toBe(true);
    expect(parsed?.randomTraceId).toBe(true);
  });

  it("trims optional whitespace around the value", () => {
    expect(parseTraceparent(`  ${VALID}\t`)?.traceId).toBe(TRACE_ID);
  });

  it("rejects an all-zero trace-id", () => {
    expect(parseTraceparent(`00-${"0".repeat(32)}-${PARENT_ID}-01`)).toBeNull();
  });

  it("rejects an all-zero parent-id", () => {
    expect(parseTraceparent(`00-${TRACE_ID}-${"0".repeat(16)}-01`)).toBeNull();
  });

  it("rejects version ff", () => {
    expect(parseTraceparent(`ff-${TRACE_ID}-${PARENT_ID}-01`)).toBeNull();
  });

  it("rejects uppercase hex anywhere (spec: MUST ignore non-lowercase hex)", () => {
    expect(parseTraceparent(`00-${TRACE_ID.toUpperCase()}-${PARENT_ID}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE_ID}-${PARENT_ID.toUpperCase()}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE_ID}-${PARENT_ID}-0A`)).toBeNull();
    expect(parseTraceparent(`0A-${TRACE_ID}-${PARENT_ID}-01`)).toBeNull();
  });

  it("rejects wrong field lengths", () => {
    expect(parseTraceparent(`00-${TRACE_ID.slice(1)}-${PARENT_ID}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE_ID}a-${PARENT_ID}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE_ID}-${PARENT_ID.slice(1)}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE_ID}-${PARENT_ID}-1`)).toBeNull();
  });

  it("rejects missing or wrong delimiters", () => {
    expect(parseTraceparent(`00_${TRACE_ID}-${PARENT_ID}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE_ID}_${PARENT_ID}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE_ID}-${PARENT_ID}_01`)).toBeNull();
  });

  it("rejects version 00 with trailing data", () => {
    expect(parseTraceparent(`${VALID}-extra`)).toBeNull();
    expect(parseTraceparent(`${VALID} `)).not.toBeNull(); // trailing OWS is trimmed, not data
    expect(parseTraceparent(`${VALID}0`)).toBeNull();
  });

  it("accepts a future version with the version-00 layout (forward compatibility)", () => {
    const parsed = parseTraceparent(`cc-${TRACE_ID}-${PARENT_ID}-01`);
    expect(parsed?.version).toBe(0xcc);
    expect(parsed?.traceId).toBe(TRACE_ID);
    expect(parsed?.sampled).toBe(true);
  });

  it("accepts a future version with dash-delimited trailing fields", () => {
    const parsed = parseTraceparent(`cc-${TRACE_ID}-${PARENT_ID}-01-what-the-future-will-be-like`);
    expect(parsed?.traceId).toBe(TRACE_ID);
  });

  it("rejects a future version with non-delimited trailing data", () => {
    expect(
      parseTraceparent(`cc-${TRACE_ID}-${PARENT_ID}-01.what-the-future-will-be-like`)
    ).toBeNull();
  });

  it("rejects garbage, empty, null, and undefined values", () => {
    expect(parseTraceparent("")).toBeNull();
    expect(parseTraceparent("garbage")).toBeNull();
    expect(parseTraceparent(null)).toBeNull();
    expect(parseTraceparent(undefined)).toBeNull();
  });

  it("accepts a single-element array and rejects multiple traceparent values", () => {
    expect(parseTraceparent([VALID])?.traceId).toBe(TRACE_ID);
    expect(parseTraceparent([VALID, VALID])).toBeNull();
    expect(parseTraceparent([])).toBeNull();
  });
});

describe("formatTraceparent", () => {
  it("round-trips a parsed header", () => {
    const parsed = parseTraceparent(VALID);
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(formatTraceparent(parsed)).toBe(VALID);
    }
  });

  it("serializes sampled and random-trace-id flags", () => {
    expect(formatTraceparent({ traceId: TRACE_ID, parentId: PARENT_ID, sampled: true })).toBe(
      `00-${TRACE_ID}-${PARENT_ID}-01`
    );
    expect(
      formatTraceparent({
        traceId: TRACE_ID,
        parentId: PARENT_ID,
        sampled: true,
        randomTraceId: true,
      })
    ).toBe(`00-${TRACE_ID}-${PARENT_ID}-03`);
    expect(formatTraceparent({ traceId: TRACE_ID, parentId: PARENT_ID })).toBe(
      `00-${TRACE_ID}-${PARENT_ID}-00`
    );
  });

  it("zeroes unknown trace-flags bits on output (spec requirement)", () => {
    expect(formatTraceparent({ traceId: TRACE_ID, parentId: PARENT_ID, traceFlags: 0xff })).toBe(
      `00-${TRACE_ID}-${PARENT_ID}-03`
    );
  });

  it("throws on invalid ids instead of emitting a discardable header", () => {
    expect(() => formatTraceparent({ traceId: "nope", parentId: PARENT_ID })).toThrow(TypeError);
    expect(() => formatTraceparent({ traceId: "0".repeat(32), parentId: PARENT_ID })).toThrow(
      TypeError
    );
    expect(() => formatTraceparent({ traceId: TRACE_ID, parentId: "0".repeat(16) })).toThrow(
      TypeError
    );
    expect(() =>
      formatTraceparent({ traceId: TRACE_ID.toUpperCase(), parentId: PARENT_ID })
    ).toThrow(TypeError);
  });
});

describe("generateTraceId / generateSpanId", () => {
  it("generates spec-valid ids", () => {
    for (let i = 0; i < 200; i++) {
      expect(isValidTraceId(generateTraceId())).toBe(true);
      expect(isValidSpanId(generateSpanId())).toBe(true);
    }
  });

  it("generates unique ids", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) ids.add(generateTraceId());
    expect(ids.size).toBe(1000);
  });

  it("round-trips through format and parse", () => {
    for (let i = 0; i < 50; i++) {
      const header = formatTraceparent({
        traceId: generateTraceId(),
        parentId: generateSpanId(),
        sampled: i % 2 === 0,
        randomTraceId: true,
      });
      const parsed = parseTraceparent(header);
      expect(parsed).not.toBeNull();
      expect(parsed && formatTraceparent(parsed)).toBe(header);
    }
  });
});

describe("isValidTraceId / isValidSpanId", () => {
  it("validates shapes", () => {
    expect(isValidTraceId(TRACE_ID)).toBe(true);
    expect(isValidTraceId(TRACE_ID.toUpperCase())).toBe(false);
    expect(isValidTraceId("0".repeat(32))).toBe(false);
    expect(isValidTraceId(PARENT_ID)).toBe(false);
    expect(isValidTraceId(42)).toBe(false);
    expect(isValidSpanId(PARENT_ID)).toBe(true);
    expect(isValidSpanId("0".repeat(16))).toBe(false);
    expect(isValidSpanId(TRACE_ID)).toBe(false);
  });
});

describe("traceContextFromHeaders", () => {
  it("continues a valid inbound trace and preserves tracestate", () => {
    const ctx = traceContextFromHeaders({
      traceparent: VALID,
      tracestate: "congo=t61rcWkgMzE",
    });
    expect(ctx).toEqual({
      traceId: TRACE_ID,
      spanId: PARENT_ID,
      sampled: true,
      traceFlags: 0x01,
      isNewTrace: false,
      tracestate: "congo=t61rcWkgMzE",
    });
  });

  it("reads header names case-insensitively", () => {
    const ctx = traceContextFromHeaders({ TraceParent: VALID } as Record<string, string>);
    expect(ctx?.traceId).toBe(TRACE_ID);
  });

  it("joins multiple tracestate fields per RFC 9110 list-header semantics", () => {
    const ctx = traceContextFromHeaders({
      traceparent: VALID,
      tracestate: ["congo=t61rcWkgMzE", "rojo=00f067aa0ba902b7"],
    });
    expect(ctx?.tracestate).toBe("congo=t61rcWkgMzE,rojo=00f067aa0ba902b7");
  });

  it("starts a new trace when traceparent is missing", () => {
    const ctx = traceContextFromHeaders({});
    expect(ctx?.isNewTrace).toBe(true);
    expect(isValidTraceId(ctx?.traceId)).toBe(true);
    expect(isValidSpanId(ctx?.spanId)).toBe(true);
    expect(ctx?.sampled).toBe(false);
    expect(ctx?.traceFlags).toBe(TRACE_FLAG_RANDOM_TRACE_ID);
    expect(ctx?.tracestate).toBeUndefined();
  });

  it("starts a new trace AND discards tracestate on an invalid traceparent (spec)", () => {
    const ctx = traceContextFromHeaders({
      traceparent: `00-${"0".repeat(32)}-${PARENT_ID}-01`,
      tracestate: "congo=t61rcWkgMzE",
    });
    expect(ctx?.isNewTrace).toBe(true);
    expect(ctx?.tracestate).toBeUndefined();
  });

  it("returns null when generateIfMissing is false and nothing valid is inbound", () => {
    expect(traceContextFromHeaders({}, { generateIfMissing: false })).toBeNull();
    expect(traceContextFromHeaders(undefined, { generateIfMissing: false })).toBeNull();
  });

  it("marks the sampled flag from TRACE_FLAG_SAMPLED", () => {
    const ctx = traceContextFromHeaders({ traceparent: `00-${TRACE_ID}-${PARENT_ID}-00` });
    expect(ctx?.sampled).toBe(false);
    expect((ctx?.traceFlags ?? 0) & TRACE_FLAG_SAMPLED).toBe(0);
  });
});
