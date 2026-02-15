/**
 * Edge-safe helpers for Next.js middleware: correlation IDs.
 * Does not import next/server so it can run in Edge and tests without next.
 */

import { CORRELATION_HEADERS, type CorrelationHeaderName } from "@simpill/protocols.utils";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Headers object keyed by correlation header names (single source: @simpill/protocols.utils). */
export type CorrelationHeaders = Record<CorrelationHeaderName, string>;

export interface WithCorrelationOptions {
  requestIdHeader?: string;
  traceIdHeader?: string;
}

/**
 * Reads or generates requestId and traceId from request headers.
 * Returns headers to set on the response (e.g. pass to NextResponse.next({ headers })).
 * Edge-safe; no Node APIs.
 */
export function withCorrelation(
  request: { headers: Headers | { get: (name: string) => string | null } },
  options: WithCorrelationOptions = {}
): CorrelationHeaders {
  const {
    requestIdHeader = CORRELATION_HEADERS.REQUEST_ID,
    traceIdHeader = CORRELATION_HEADERS.TRACE_ID,
  } = options;
  const headers = request.headers;
  const get = (name: string) => (typeof headers.get === "function" ? headers.get(name) : null);
  const requestId = get(requestIdHeader) ?? get(CORRELATION_HEADERS.REQUEST_ID) ?? randomId();
  const traceId = get(traceIdHeader) ?? get(CORRELATION_HEADERS.TRACE_ID) ?? requestId;
  return {
    [CORRELATION_HEADERS.REQUEST_ID]: requestId,
    [CORRELATION_HEADERS.TRACE_ID]: traceId,
  };
}
