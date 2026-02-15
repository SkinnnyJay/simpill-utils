/** Header names for request/trace correlation (middleware, request-context, logging). */
export const CORRELATION_HEADERS = {
  REQUEST_ID: "x-request-id",
  TRACE_ID: "x-trace-id",
} as const;

export type CorrelationHeaderName = (typeof CORRELATION_HEADERS)[keyof typeof CORRELATION_HEADERS];
