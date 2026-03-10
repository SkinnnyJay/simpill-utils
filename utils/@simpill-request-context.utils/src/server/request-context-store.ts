import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestContext } from "../shared";

export interface RequestContextStore {
  run<T>(context: RequestContext, fn: () => T): T;
  runAsync<T>(context: RequestContext, fn: () => Promise<T>): Promise<T>;
  getStore(): RequestContext | undefined;
}

class RequestContextStoreImpl implements RequestContextStore {
  private readonly asyncLocal = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, fn: () => T): T {
    return this.asyncLocal.run(context, fn);
  }

  runAsync<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return this.asyncLocal.run(context, fn);
  }

  getStore(): RequestContext | undefined {
    return this.asyncLocal.getStore();
  }
}

let defaultStore: RequestContextStore | null = null;

/**
 * Create a new request context store backed by AsyncLocalStorage.
 * Each store is independent; use one per app or pass the same instance where needed.
 */
export function createRequestContextStore(): RequestContextStore {
  return new RequestContextStoreImpl();
}

/**
 * Get the default store (lazily created). Used by getRequestContext() and runWithRequestContext().
 */
function getDefaultStore(): RequestContextStore {
  if (defaultStore === null) {
    defaultStore = createRequestContextStore();
  }
  return defaultStore;
}

/**
 * Run fn (sync or async) with the given request context. Uses the default store.
 * Context is available across the entire async execution including awaits.
 */
export async function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T | Promise<T>,
): Promise<T> {
  const store = getDefaultStore();
  return store.runAsync(context, () => Promise.resolve(fn()));
}

/**
 * Get the current request context from the default store, or undefined if not inside a run.
 */
export function getRequestContext(): RequestContext | undefined {
  return getDefaultStore().getStore();
}
