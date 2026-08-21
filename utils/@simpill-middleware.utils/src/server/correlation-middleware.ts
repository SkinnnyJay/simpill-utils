import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import { runWithRequestContext } from "@simpill/request-context.utils";
import { generateUUID } from "@simpill/uuid.utils";
import type { HeadersLike, Middleware, MiddlewareRequest, MiddlewareResponse } from "../shared";
import { VALUE_0 } from "../shared/constants";
import { parseTraceparent } from "../shared/traceparent";

export interface CreateCorrelationMiddlewareOptions {
  requestIdHeader?: string;
  traceIdHeader?: string;
  generateRequestId?: () => string;
  /**
   * Whether client-supplied correlation ids are trusted at all.
   * `false` = always generate fresh ids (Envoy-style sanitization for edge
   * services). Default `true` (ids are still validated — see `isValidId`).
   */
  trustIncomingIds?: boolean;
  /**
   * Validator for incoming ids. Invalid ids are DISCARDED and replaced with a
   * generated one — never reflected into the response, the request context,
   * or logs. Default: 1–128 chars of `[A-Za-z0-9._~-]` (URI-unreserved), which
   * accepts UUID/ULID/KSUID/base62/base64url ids while rejecting whitespace,
   * control characters, delimiters, and oversized values.
   */
  isValidId?: (id: string) => boolean;
  /**
   * Read the W3C `traceparent` header (https://www.w3.org/TR/trace-context/)
   * when the trace-id header is absent; on a valid traceparent the context
   * gets `traceId` (32-hex trace-id) and `spanId` (16-hex parent-id).
   * Default `true`.
   */
  useTraceparent?: boolean;
  /** Set the request-id / trace-id response headers. Default `true`. */
  setResponseHeaders?: boolean;
}

const DEFAULT_ID_RE = /^[A-Za-z0-9._~-]{1,128}$/;

function defaultIsValidId(id: string): boolean {
  return DEFAULT_ID_RE.test(id);
}

/**
 * Returns the id when it passes the default correlation-id rules; otherwise undefined.
 * Used to reject CR LF, spaces, and oversized values before they enter logs/headers.
 */
export function sanitizeCorrelationId(id: string | null | undefined): string | undefined {
  if (id === null || id === undefined || id === "") {
    return undefined;
  }
  return defaultIsValidId(id) ? id : undefined;
}

function getHeader(headers: HeadersLike | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as { get?: unknown }).get === "function") {
    // Fetch-API Headers (Edge runtimes, Next.js, undici): case-insensitive get().
    const got = (headers as { get(n: string): string | null }).get(name);
    return got === null ? undefined : got;
  }
  const record = headers as Record<string, string | string[] | undefined>;
  const v = record[name.toLowerCase()] ?? record[name];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > VALUE_0) return v[VALUE_0];
  return undefined;
}

/**
 * Returns a middleware that sets requestId/traceId from headers or generates
 * them, then runs the rest of the chain inside runWithRequestContext.
 *
 * Incoming ids are validated before use (see `isValidId`): a hostile or
 * malformed `x-request-id` is never echoed back into response headers or
 * carried into the logging context. Trace ids additionally fall back to the
 * W3C `traceparent` header before defaulting to the request id.
 */
export function createCorrelationMiddleware(
  options?: CreateCorrelationMiddlewareOptions,
): Middleware<MiddlewareRequest, MiddlewareResponse> {
  const requestIdHeader = options?.requestIdHeader ?? CORRELATION_HEADERS.REQUEST_ID;
  const traceIdHeader = options?.traceIdHeader ?? CORRELATION_HEADERS.TRACE_ID;
  const generateRequestId = options?.generateRequestId ?? generateUUID;
  const trustIncomingIds = options?.trustIncomingIds ?? true;
  const isValidId = options?.isValidId ?? defaultIsValidId;
  const useTraceparent = options?.useTraceparent ?? true;
  const setResponseHeaders = options?.setResponseHeaders ?? true;

  const acceptIncoming = (raw: string | undefined): string | undefined => {
    if (!trustIncomingIds || raw === undefined) return undefined;
    return isValidId(raw) ? raw : undefined;
  };

  return (req, res, next) => {
    const requestId =
      acceptIncoming(getHeader(req.headers, requestIdHeader)) ?? generateRequestId();

    let traceId = acceptIncoming(getHeader(req.headers, traceIdHeader));
    let spanId: string | undefined;
    if (traceId === undefined && useTraceparent) {
      const tp = parseTraceparent(getHeader(req.headers, "traceparent"));
      if (tp !== undefined) {
        traceId = tp.traceId;
        spanId = tp.parentId;
      }
    }
    traceId = traceId ?? requestId;

    const context = spanId === undefined ? { requestId, traceId } : { requestId, traceId, spanId };

    return runWithRequestContext(context, () => {
      if (setResponseHeaders) {
        res.setHeader?.(requestIdHeader, requestId);
        res.setHeader?.(traceIdHeader, traceId as string);
      }
      return Promise.resolve(next());
    });
  };
}
