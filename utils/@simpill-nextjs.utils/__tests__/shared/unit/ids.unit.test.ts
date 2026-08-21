/** @file W3C trace context + correlation id primitives (uplift) */
import {
  CORRELATION_ID_PATTERN,
  formatTraceparent,
  generateSpanId,
  generateTraceId,
  isValidCorrelationId,
  parseTraceparent,
  randomId,
} from "../../../src/shared/ids";

describe("CORRELATION_ID_PATTERN / isValidCorrelationId", () => {
  it("accepts URL-safe ids 1-128 chars", () => {
    expect(isValidCorrelationId("r1")).toBe(true);
    expect(isValidCorrelationId("a-b_c.d~e")).toBe(true);
    expect(isValidCorrelationId("A".repeat(128))).toBe(true);
    expect(isValidCorrelationId(randomId())).toBe(true);
  });

  it("rejects oversized, empty, injecting, and non-string values", () => {
    expect(isValidCorrelationId("A".repeat(129))).toBe(false);
    expect(isValidCorrelationId("")).toBe(false);
    expect(isValidCorrelationId("evil\nX-Injected: 1")).toBe(false);
    expect(isValidCorrelationId("id with space")).toBe(false);
    expect(isValidCorrelationId(null)).toBe(false);
    expect(isValidCorrelationId(42)).toBe(false);
  });

  it("pattern is anchored (no substring match)", () => {
    expect(CORRELATION_ID_PATTERN.test("ok\u0000")).toBe(false);
  });
});

describe("parseTraceparent (W3C strict)", () => {
  const TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";
  const PARENT = "00f067aa0ba902b7";

  it("parses the W3C example vector", () => {
    const parsed = parseTraceparent(`00-${TRACE}-${PARENT}-01`);
    expect(parsed).toEqual({ version: "00", traceId: TRACE, parentId: PARENT, flags: "01" });
  });

  it("rejects all-zero trace-id and parent-id", () => {
    expect(parseTraceparent(`00-${"0".repeat(32)}-${PARENT}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE}-${"0".repeat(16)}-01`)).toBeNull();
  });

  it("rejects version ff, uppercase hex, wrong lengths, garbage", () => {
    expect(parseTraceparent(`ff-${TRACE}-${PARENT}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE.toUpperCase()}-${PARENT}-01`)).toBeNull();
    expect(parseTraceparent(`00-${TRACE.slice(1)}-${PARENT}-01`)).toBeNull();
    expect(parseTraceparent("not-a-traceparent")).toBeNull();
    expect(parseTraceparent(null)).toBeNull();
    expect(parseTraceparent(undefined)).toBeNull();
  });

  it("tolerates future versions with extra -suffix, rejects extra content on version 00", () => {
    expect(parseTraceparent(`cc-${TRACE}-${PARENT}-01-extra-members`)).toEqual({
      version: "cc",
      traceId: TRACE,
      parentId: PARENT,
      flags: "01",
    });
    expect(parseTraceparent(`00-${TRACE}-${PARENT}-01-extra`)).toBeNull();
    expect(parseTraceparent(`cc-${TRACE}-${PARENT}-01extra`)).toBeNull();
  });
});

describe("generators", () => {
  it("generateTraceId: 32 lowercase hex, non-zero, unique", () => {
    const a = generateTraceId();
    const b = generateTraceId();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe("0".repeat(32));
    expect(a).not.toBe(b);
  });

  it("generateSpanId: 16 lowercase hex, non-zero", () => {
    expect(generateSpanId()).toMatch(/^[0-9a-f]{16}$/);
    expect(generateSpanId()).not.toBe("0".repeat(16));
  });

  it("formatTraceparent round-trips and throws on invalid members", () => {
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    const header = formatTraceparent(traceId, spanId);
    expect(parseTraceparent(header)).toEqual({
      version: "00",
      traceId,
      parentId: spanId,
      flags: "01",
    });
    expect(() => formatTraceparent("nope", spanId)).toThrow(TypeError);
    expect(() => formatTraceparent("0".repeat(32), spanId)).toThrow(TypeError);
  });

  it("randomId produces valid correlation ids", () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidCorrelationId(randomId())).toBe(true);
    }
  });
});
