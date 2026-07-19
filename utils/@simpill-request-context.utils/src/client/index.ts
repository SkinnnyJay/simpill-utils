import type { RequestContext } from "../shared";
import { RequestContextUnavailableError } from "../shared";

/**
 * Client/Edge entry: no AsyncLocalStorage in browser/Edge runtimes.
 * This entry mirrors the FULL server API surface so isomorphic code can
 * import the same names from either entry without crashing at import time:
 * run* helpers execute fn without installing context, getters return
 * undefined, mutators are no-ops returning false.
 */

/** Always undefined on client/edge (no AsyncLocalStorage). */
export function getRequestContext<T extends RequestContext = RequestContext>(): T | undefined {
  return undefined;
}

/** Always throws on client/edge — there is never an active context. */
export function requireRequestContext<T extends RequestContext = RequestContext>(): T {
  throw new RequestContextUnavailableError(
    "No request context on client/edge: use the server entry in Node",
  );
}

/** Executes fn without installing context. Sync throw becomes a rejection. */
export async function runWithRequestContext<R, T extends RequestContext = RequestContext>(
  _context: T,
  fn: () => R | Promise<R>,
): Promise<R> {
  return fn();
}

/** Executes fn without installing context. */
export function runWithRequestContextSync<R, T extends RequestContext = RequestContext>(
  _context: T,
  fn: () => R,
): R {
  return fn();
}

/** Executes fn without installing context (no parent to inherit on client). */
export function runWithChildRequestContext<R, T extends RequestContext = RequestContext>(
  _patch: Partial<T>,
  fn: () => R,
): R {
  return fn();
}

/** No-op on client/edge; returns false (nothing to update). */
export function updateRequestContext<T extends RequestContext = RequestContext>(
  _patch: Partial<T>,
): boolean {
  return false;
}

/** Always undefined on client/edge. */
export function getRequestContextValue<V = unknown>(_key: string): V | undefined {
  return undefined;
}

/** No-op on client/edge; returns false. */
export function setRequestContextValue(_key: string, _value: unknown): boolean {
  return false;
}

/** Identity on client/edge — there is no context to capture. */
export function bindRequestContext<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  return fn;
}

export type { RequestContext } from "../shared";
export { RequestContextUnavailableError } from "../shared";
