/**
 * Edge-safe helpers for Next.js middleware: correlation IDs.
 * Does not import next/server so it can run in Edge and tests without next.
 */

import { CORRELATION_HEADERS, type CorrelationHeaderName } from "@simpill/protocols.utils";
import { CORRELATION_ID_PATTERN, parseTraceparent, randomId } from "../shared/ids";

/** W3C Trace Context request header read when the trace-id header is absent. */
const TRACEPARENT_HEADER = "traceparent";

/** Headers object keyed by correlation header names (single source: @simpill/protocols.utils). */
export type CorrelationHeaders = Record<CorrelationHeaderName, string>;

export interface WithCorrelationOptions {
  requestIdHeader?: string;
  traceIdHeader?: string;
  /**
   * Reflect incoming header values verbatim without validation (pre-uplift behavior).
   * Default false: incoming ids must match `idPattern` or they are regenerated —
   * otherwise a client can push 16KB values or log-injection payloads straight into
   * responses, request context, and log lines.
   */
  trustIncomingIds?: boolean;
  /** Pattern incoming ids must match when not trusted. Default CORRELATION_ID_PATTERN. */
  idPattern?: RegExp;
  /**
   * When the trace-id header is absent, read the W3C `traceparent` header and reuse
   * its trace-id so correlation joins distributed traces. Default true.
   */
  readTraceparent?: boolean;
}

function sanitizeId(
  value: string | null,
  trustIncomingIds: boolean,
  idPattern: RegExp
): string | null {
  if (value === null || trustIncomingIds) {
    return value;
  }
  // Reset stateful lastIndex in case a global-flagged pattern is supplied.
  idPattern.lastIndex = 0;
  return idPattern.test(value) ? value : null;
}

/**
 * Reads or generates requestId and traceId from request headers.
 * Returns headers to set on the response (e.g. pass to NextResponse.next({ headers })).
 * Edge-safe; no Node APIs. Incoming ids are validated against `idPattern` before
 * being reflected; invalid ids are replaced with generated ones.
 */
export function withCorrelation(
  request: { headers: Headers | { get: (name: string) => string | null } },
  options: WithCorrelationOptions = {}
): CorrelationHeaders {
  const {
    requestIdHeader = CORRELATION_HEADERS.REQUEST_ID,
    traceIdHeader = CORRELATION_HEADERS.TRACE_ID,
    trustIncomingIds = false,
    idPattern = CORRELATION_ID_PATTERN,
    readTraceparent = true,
  } = options;
  const headers = request.headers;
  const get = (name: string) => (typeof headers.get === "function" ? headers.get(name) : null);
  const pick = (name: string) => sanitizeId(get(name), trustIncomingIds, idPattern);

  const requestId = pick(requestIdHeader) ?? pick(CORRELATION_HEADERS.REQUEST_ID) ?? randomId();
  let traceId = pick(traceIdHeader) ?? pick(CORRELATION_HEADERS.TRACE_ID);
  if (traceId === null && readTraceparent) {
    const parsed = parseTraceparent(get(TRACEPARENT_HEADER));
    if (parsed !== null) {
      traceId = parsed.traceId;
    }
  }
  return {
    [CORRELATION_HEADERS.REQUEST_ID]: requestId,
    [CORRELATION_HEADERS.TRACE_ID]: traceId ?? requestId,
  };
}
