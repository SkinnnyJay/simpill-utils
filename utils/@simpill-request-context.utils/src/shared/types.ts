/**
 * Request context shape; compatible with LogContext from @simpill/logger.utils.
 * Use with AsyncLocalStorage so all code in a request can read the same context.
 */
export interface RequestContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  [key: string]: unknown;
}
