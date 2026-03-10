/**
 * @simpill/middleware.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { createCorrelationMiddleware } from "@simpill/middleware.utils/server";
import type { MiddlewareRequest, MiddlewareResponse } from "@simpill/middleware.utils/shared";
import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import { getRequestContext } from "@simpill/request-context.utils";

const correlationMiddleware = createCorrelationMiddleware({
  requestIdHeader: CORRELATION_HEADERS.REQUEST_ID,
  traceIdHeader: CORRELATION_HEADERS.TRACE_ID,
  generateRequestId: () => crypto.randomUUID(),
});

// Simulate a request: middleware runs and sets context; "handler" reads it
const mockReq: MiddlewareRequest = {
  headers: {},
};
const mockRes: MiddlewareResponse & { headersSet: Record<string, string> } = {
  headersSet: {},
  setHeader(name: string, value: string) {
    this.headersSet[name] = value;
  },
};

correlationMiddleware(mockReq, mockRes, () => {
  const ctx = getRequestContext();
  console.log("RequestId in handler:", ctx?.requestId);
  console.log("TraceId in handler:", ctx?.traceId);
  console.log("Response headers set:", mockRes.headersSet);
});
