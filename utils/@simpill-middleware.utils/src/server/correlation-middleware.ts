import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import { runWithRequestContext } from "@simpill/request-context.utils";
import { generateUUID } from "@simpill/uuid.utils";
import type { Middleware, MiddlewareRequest, MiddlewareResponse } from "../shared";
import { VALUE_0 } from "../shared/constants";

export interface CreateCorrelationMiddlewareOptions {
  requestIdHeader?: string;
  traceIdHeader?: string;
  generateRequestId?: () => string;
}

function getHeader(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const v = headers[name.toLowerCase()] ?? headers[name];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > VALUE_0) return v[VALUE_0];
  return undefined;
}

/**
 * Returns a middleware that sets requestId/traceId from headers or generates them,
 * then runs the rest of the chain inside runWithRequestContext.
 */
export function createCorrelationMiddleware(
  options?: CreateCorrelationMiddlewareOptions,
): Middleware<MiddlewareRequest, MiddlewareResponse> {
  const requestIdHeader = options?.requestIdHeader ?? CORRELATION_HEADERS.REQUEST_ID;
  const traceIdHeader = options?.traceIdHeader ?? CORRELATION_HEADERS.TRACE_ID;
  const generateRequestId = options?.generateRequestId ?? generateUUID;

  return (req, res, next) => {
    const requestId = getHeader(req.headers, requestIdHeader) ?? generateRequestId();
    const traceId = getHeader(req.headers, traceIdHeader) ?? requestId;

    return runWithRequestContext({ requestId, traceId }, () => {
      res.setHeader?.(requestIdHeader, requestId);
      res.setHeader?.(traceIdHeader, traceId);
      return Promise.resolve(next());
    });
  };
}
