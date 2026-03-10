import { setLogContextProvider } from "@simpill/logger.utils";
import { getRequestContext } from "@simpill/request-context.utils/server";

/**
 * Wires request context into the logger so all logs in a request
 * automatically include requestId, traceId, etc.
 * Call once at app startup (e.g. after importing logger and request-context).
 */
export function setupObservability(options?: {
  /** When true (default), sets logger's context provider to getRequestContext() */
  setLogContextProvider?: boolean;
}): void {
  if (options?.setLogContextProvider === false) return;
  setLogContextProvider(getRequestContext);
}
