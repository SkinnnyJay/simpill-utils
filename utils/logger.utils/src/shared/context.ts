/**
 * @file Log Context Provider
 * @description Correlation context for distributed tracing and request tracking
 *
 * This module provides a way to automatically inject context (traceId, requestId, userId, etc.)
 * into all log entries without passing metadata explicitly to every log call.
 *
 * @example
 * ```typescript
 * // Setup with AsyncLocalStorage (Node.js)
 * import { AsyncLocalStorage } from "async_hooks";
 * import { setLogContextProvider, type LogContext } from "@simpill/logger.utils";
 *
 * const als = new AsyncLocalStorage<LogContext>();
 * setLogContextProvider(() => als.getStore());
 *
 * // In middleware
 * app.use((req, res, next) => {
 *   als.run({ traceId: crypto.randomUUID(), requestId: req.id }, () => {
 *     next();
 *   });
 * });
 *
 * // All logs automatically include traceId and requestId
 * logger.info("Processing request"); // { traceId: "...", requestId: "..." }
 * ```
 */

/**
 * Context that can be automatically injected into log entries
 * Common fields for distributed tracing and request tracking
 */
export interface LogContext {
  /** Distributed trace ID (e.g., OpenTelemetry trace ID) */
  traceId?: string;
  /** Span ID within a trace */
  spanId?: string;
  /** Request ID for HTTP request correlation */
  requestId?: string;
  /** User ID for user-scoped logging */
  userId?: string;
  /** Session ID for session-scoped logging */
  sessionId?: string;
  /** Tenant ID for multi-tenant applications */
  tenantId?: string;
  /** Additional custom context fields */
  [key: string]: unknown;
}

/**
 * Function that returns the current log context
 * Typically backed by AsyncLocalStorage or similar mechanism
 */
export type LogContextProvider = () => LogContext | undefined;

/**
 * Global context provider instance
 */
let contextProvider: LogContextProvider | null = null;

/**
 * Set the global log context provider
 *
 * The provider function is called on every log entry to get the current context.
 * Use AsyncLocalStorage or similar to provide request-scoped context.
 *
 * @param provider - Function that returns the current LogContext, or undefined if no context
 *
 * @example
 * ```typescript
 * // Using AsyncLocalStorage
 * const als = new AsyncLocalStorage<LogContext>();
 * setLogContextProvider(() => als.getStore());
 *
 * // Using a simple global (not recommended for concurrent requests)
 * let currentContext: LogContext | undefined;
 * setLogContextProvider(() => currentContext);
 * ```
 */
export function setLogContextProvider(provider: LogContextProvider): void {
  contextProvider = provider;
}

/**
 * Clear the global log context provider
 * Useful for testing or when shutting down
 */
export function clearLogContextProvider(): void {
  contextProvider = null;
}

/**
 * Get the current log context from the provider
 * Returns undefined if no provider is set or provider returns undefined
 *
 * @returns Current LogContext or undefined
 */
export function getLogContext(): LogContext | undefined {
  try {
    return contextProvider?.();
  } catch {
    // Never let context provider errors affect logging
    return undefined;
  }
}

/**
 * Check if a context provider is configured
 */
export function hasLogContextProvider(): boolean {
  return contextProvider !== null;
}

/**
 * Create a child context by merging parent context with additional fields
 * Useful for adding span-level context within a trace
 *
 * @param additional - Additional context fields to merge
 * @returns Merged context or just the additional fields if no parent context
 */
export function withLogContext(additional: LogContext): LogContext {
  const current = getLogContext();
  return current ? { ...current, ...additional } : additional;
}
