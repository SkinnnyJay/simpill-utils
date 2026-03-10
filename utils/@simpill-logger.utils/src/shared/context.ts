/** Log context provider: inject traceId, requestId, etc. into all log entries (e.g. via AsyncLocalStorage). */

export interface LogContext {
  traceId?: string;
  spanId?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

/** Returns current log context (e.g. from AsyncLocalStorage). */
export type LogContextProvider = () => LogContext | undefined;

let contextProvider: LogContextProvider | null = null;

/** Set global context provider; called on every log entry. */
export function setLogContextProvider(provider: LogContextProvider): void {
  contextProvider = provider;
}

/** Clear the global context provider (e.g. for tests). */
export function clearLogContextProvider(): void {
  contextProvider = null;
}

/** Current log context or undefined if no provider or provider returns undefined. */
export function getLogContext(): LogContext | undefined {
  try {
    return contextProvider?.();
  } catch {
    return undefined;
  }
}

/** True if a context provider is configured. */
export function hasLogContextProvider(): boolean {
  return contextProvider !== null;
}

/** Merge parent context with additional fields; returns additional only if no parent. */
export function withLogContext(additional: LogContext): LogContext {
  const current = getLogContext();
  return current ? { ...current, ...additional } : additional;
}
