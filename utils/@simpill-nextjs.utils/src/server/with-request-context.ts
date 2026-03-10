import { CORRELATION_HEADERS } from "@simpill/protocols.utils";
import type { RequestContext } from "@simpill/request-context.utils";
import { getRequestContext, runWithRequestContext } from "@simpill/request-context.utils";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export interface WithRequestContextOptions {
  requestIdHeader?: string;
  traceIdHeader?: string;
  getHeaders?: () => Headers | Promise<Headers>;
}

/**
 * Wraps an async handler so it runs inside runWithRequestContext.
 * Reads requestId/traceId from getHeaders() or generates them.
 */
export function withRequestContext<T>(
  handler: () => Promise<T>,
  options: WithRequestContextOptions = {}
): Promise<T> {
  const {
    requestIdHeader = CORRELATION_HEADERS.REQUEST_ID,
    traceIdHeader = CORRELATION_HEADERS.TRACE_ID,
    getHeaders = () => new Headers(),
  } = options;

  const buildContext = async (): Promise<RequestContext> => {
    const headers = typeof getHeaders === "function" ? await getHeaders() : new Headers();
    const requestId =
      headers.get(requestIdHeader) ?? headers.get(CORRELATION_HEADERS.REQUEST_ID) ?? randomId();
    const traceId =
      headers.get(traceIdHeader) ?? headers.get(CORRELATION_HEADERS.TRACE_ID) ?? requestId;
    return { requestId, traceId };
  };

  return buildContext().then((context) => runWithRequestContext(context, () => handler()));
}

export { getRequestContext };
