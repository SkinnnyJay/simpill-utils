/** Header names for request/trace correlation (middleware, request-context, logging). */
export const CORRELATION_HEADERS = {
  REQUEST_ID: "x-request-id",
  TRACE_ID: "x-trace-id",
} as const;
Object.freeze(CORRELATION_HEADERS);

export type CorrelationHeaderName = (typeof CORRELATION_HEADERS)[keyof typeof CORRELATION_HEADERS];

/**
 * W3C Trace Context header names (W3C Recommendation).
 * Kept separate from CORRELATION_HEADERS so the CorrelationHeaderName
 * union stays stable for consumers that key records off it.
 */
export const TRACE_CONTEXT_HEADERS = {
  TRACEPARENT: "traceparent",
  TRACESTATE: "tracestate",
} as const;
Object.freeze(TRACE_CONTEXT_HEADERS);

export type TraceContextHeaderName =
  (typeof TRACE_CONTEXT_HEADERS)[keyof typeof TRACE_CONTEXT_HEADERS];

/** The traceparent version this package's pattern validates. */
export const TRACE_CONTEXT_VERSION = "00";

/**
 * Canonical correlation-id value shape: 1–128 chars of [A-Za-z0-9._~-]
 * (URL-safe unreserved set). Incoming x-request-id values that do not
 * match MUST NOT be reflected into responses, contexts, or logs
 * (log-injection / header-reflection hardening).
 */
export const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._~-]{1,128}$/;

/**
 * Strict W3C Trace Context version-00 traceparent shape:
 * `00-<32 lowercase hex trace-id>-<16 lowercase hex parent-id>-<2 hex flags>`
 * with all-zero trace-id and all-zero parent-id rejected as the spec requires.
 */
export const TRACEPARENT_PATTERN = /^00-(?!0{32})[0-9a-f]{32}-(?!0{16})[0-9a-f]{16}-[0-9a-f]{2}$/;
