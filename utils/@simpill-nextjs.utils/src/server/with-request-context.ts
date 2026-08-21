import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import type { RequestContext } from "@simpill/request-context.utils";
import { getRequestContext, runWithRequestContext } from "@simpill/request-context.utils";
import { CORRELATION_ID_PATTERN, parseTraceparent, randomId } from "../shared/ids";

/** W3C Trace Context request header read when the trace-id header is absent. */
const TRACEPARENT_HEADER = "traceparent";

export interface WithRequestContextOptions {
  requestIdHeader?: string;
  traceIdHeader?: string;
  getHeaders?: () => Headers | Promise<Headers>;
  /**
   * Reflect incoming header values verbatim without validation (pre-uplift behavior).
   * Default false: incoming ids must match `idPattern` or they are regenerated.
   */
  trustIncomingIds?: boolean;
  /** Pattern incoming ids must match when not trusted. Default CORRELATION_ID_PATTERN. */
  idPattern?: RegExp;
  /**
   * When the trace-id header is absent, read the W3C `traceparent` header and reuse
   * its trace-id. Default true.
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
  idPattern.lastIndex = 0;
  return idPattern.test(value) ? value : null;
}

/**
 * Wraps an async handler so it runs inside runWithRequestContext.
 * Reads requestId/traceId from getHeaders() (validated against `idPattern`)
 * or generates them. Falls back to the W3C `traceparent` trace-id when no
 * trace-id header is present.
 */
export function withRequestContext<T>(
  handler: () => Promise<T>,
  options: WithRequestContextOptions = {}
): Promise<T> {
  const {
    requestIdHeader = CORRELATION_HEADERS.REQUEST_ID,
    traceIdHeader = CORRELATION_HEADERS.TRACE_ID,
    getHeaders = () => new Headers(),
    trustIncomingIds = false,
    idPattern = CORRELATION_ID_PATTERN,
    readTraceparent = true,
  } = options;

  const buildContext = async (): Promise<RequestContext> => {
    const headers = await getHeaders();
    const pick = (name: string) => sanitizeId(headers.get(name), trustIncomingIds, idPattern);
    const requestId = pick(requestIdHeader) ?? pick(CORRELATION_HEADERS.REQUEST_ID) ?? randomId();
    let traceId = pick(traceIdHeader) ?? pick(CORRELATION_HEADERS.TRACE_ID);
    if (traceId === null && readTraceparent) {
      const parsed = parseTraceparent(headers.get(TRACEPARENT_HEADER));
      if (parsed !== null) {
        traceId = parsed.traceId;
      }
    }
    return { requestId, traceId: traceId ?? requestId };
  };

  return buildContext().then((context) => runWithRequestContext(context, () => handler()));
}

export { getRequestContext };
