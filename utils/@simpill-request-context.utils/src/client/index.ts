import type { RequestContext } from "../shared";

/**
 * Client/Edge stub: no AsyncLocalStorage. Returns undefined.
 * Use @simpill/request-context.utils/server in Node for real context.
 */
export function getRequestContext(): RequestContext | undefined {
  return undefined;
}

export type { RequestContext } from "../shared";
