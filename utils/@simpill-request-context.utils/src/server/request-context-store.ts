import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestContext } from "../shared";
import { RequestContextUnavailableError } from "../shared";

export interface RequestContextStore<T extends RequestContext = RequestContext> {
  /** Run fn synchronously with the given context; returns fn's value. */
  run<R>(context: T, fn: () => R): R;
  /**
   * Run an async fn with the given context. A synchronous throw inside fn
   * is converted into a rejection (the Promise<R> contract is always honored).
   */
  runAsync<R>(context: T, fn: () => Promise<R>): Promise<R>;
  /** Current context for this store, or undefined outside a run. */
  getStore(): T | undefined;
  /**
   * Shallow-merge patch into the CURRENT context object (in place), so the
   * update is visible everywhere in the active run — including code that read
   * the context earlier. Returns false (and does nothing) outside a run.
   */
  update(patch: Partial<T>): boolean;
  /**
   * Run fn with a CHILD context: a new object inheriting the current context's
   * fields with patch applied on top. The parent object is never aliased or
   * mutated; it becomes visible again when fn completes.
   */
  runWithChild<R>(patch: Partial<T>, fn: () => R): R;
  /**
   * Capture the current context and return a function that always executes fn
   * within it (e.g. for EventEmitter listeners or setTimeout callbacks that
   * would otherwise lose context). Outside a run, returns fn unchanged.
   * Note: binds only THIS store, unlike AsyncLocalStorage.snapshot() which
   * captures every ALS instance in the process.
   */
  bind<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R;
}

class RequestContextStoreImpl<T extends RequestContext> implements RequestContextStore<T> {
  private readonly asyncLocal = new AsyncLocalStorage<T>();

  run<R>(context: T, fn: () => R): R {
    return this.asyncLocal.run(context, fn);
  }

  runAsync<R>(context: T, fn: () => Promise<R>): Promise<R> {
    return this.asyncLocal.run(context, () => {
      try {
        return Promise.resolve(fn());
      } catch (error) {
        return Promise.reject(error);
      }
    });
  }

  getStore(): T | undefined {
    return this.asyncLocal.getStore();
  }

  update(patch: Partial<T>): boolean {
    const current = this.asyncLocal.getStore();
    if (current === undefined) {
      return false;
    }
    Object.assign(current, patch);
    return true;
  }

  runWithChild<R>(patch: Partial<T>, fn: () => R): R {
    const parent = this.asyncLocal.getStore();
    const child = { ...parent, ...patch } as T;
    return this.asyncLocal.run(child, fn);
  }

  bind<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    const captured = this.asyncLocal.getStore();
    if (captured === undefined) {
      return fn;
    }
    const asyncLocal = this.asyncLocal;
    return (...args: A): R => asyncLocal.run(captured, () => fn(...args));
  }
}

/**
 * Create a new request context store backed by AsyncLocalStorage.
 * Each store is independent; use one per app or pass the same instance where needed.
 */
export function createRequestContextStore<
  T extends RequestContext = RequestContext,
>(): RequestContextStore<T> {
  return new RequestContextStoreImpl<T>();
}

/**
 * The default store is anchored on a Symbol.for() global-registry key so that
 * duplicate copies of this package in one process (npm dedupe failures,
 * monorepo double-installs, bundled + node_modules copies) all share ONE
 * store. A module-level variable would give each copy its own invisible
 * store, silently breaking context lookup across the boundary.
 */
const GLOBAL_STORE_KEY = Symbol.for("@simpill/request-context.utils:defaultStore");

type GlobalWithStore = typeof globalThis & {
  [GLOBAL_STORE_KEY]?: RequestContextStore;
};

/**
 * Per-copy cache: the registry lookup only matters ONCE (to agree on the
 * shared instance). Hot-path calls hit this module-level variable so
 * getRequestContext() stays at raw-AsyncLocalStorage speed.
 */
let cachedDefaultStore: RequestContextStore | undefined;

/** Cold path — runs once per module copy. Kept out of getDefaultStore so the
 *  hot path stays under V8's inlining budget (measured 2.2x otherwise). */
function resolveDefaultStore(): RequestContextStore {
  const globalRef = globalThis as GlobalWithStore;
  let store = globalRef[GLOBAL_STORE_KEY];
  if (store === undefined) {
    store = createRequestContextStore();
    globalRef[GLOBAL_STORE_KEY] = store;
  }
  cachedDefaultStore = store;
  return store;
}

function getDefaultStore(): RequestContextStore {
  return cachedDefaultStore ?? resolveDefaultStore();
}

/**
 * Run fn (sync or async) with the given request context. Uses the default store.
 * Context is available across the entire async execution including awaits.
 * Always returns a Promise; a synchronous throw inside fn becomes a rejection.
 */
export async function runWithRequestContext<R, T extends RequestContext = RequestContext>(
  context: T,
  fn: () => R | Promise<R>,
): Promise<R> {
  const store = getDefaultStore();
  return store.runAsync(context, () => Promise.resolve(fn()));
}

/**
 * Synchronous variant: runs fn with the given context on the default store and
 * returns fn's value directly — no Promise allocation, no microtask deferral.
 * Use for sync call chains (CLI handlers, sync middleware, tests).
 */
export function runWithRequestContextSync<R, T extends RequestContext = RequestContext>(
  context: T,
  fn: () => R,
): R {
  return getDefaultStore().run(context, fn);
}

/**
 * Get the current request context from the default store, or undefined if not inside a run.
 */
export function getRequestContext<T extends RequestContext = RequestContext>(): T | undefined {
  return getDefaultStore().getStore() as T | undefined;
}

/**
 * Get the current request context or throw RequestContextUnavailableError if
 * not inside a run. Use where a missing context is a programming error.
 */
export function requireRequestContext<T extends RequestContext = RequestContext>(): T {
  const context = getDefaultStore().getStore();
  if (context === undefined) {
    throw new RequestContextUnavailableError();
  }
  return context as T;
}

/**
 * Shallow-merge patch into the current default-store context (in place).
 * Visible to ALL readers in the active run — the standard way to enrich
 * context mid-request (e.g. add userId after auth). Returns false outside a run.
 */
export function updateRequestContext<T extends RequestContext = RequestContext>(
  patch: Partial<T>,
): boolean {
  return (getDefaultStore() as RequestContextStore<T>).update(patch);
}

/** Read a single value from the current context (undefined outside a run). */
export function getRequestContextValue<V = unknown>(key: string): V | undefined {
  const context = getDefaultStore().getStore();
  return context === undefined ? undefined : (context[key] as V | undefined);
}

/** Set a single value on the current context. Returns false outside a run. */
export function setRequestContextValue(key: string, value: unknown): boolean {
  return getDefaultStore().update({ [key]: value });
}

/**
 * Run fn with a CHILD context on the default store: inherits the current
 * context's fields (shallow copy — never aliased) with patch applied on top.
 * The parent context is untouched and becomes visible again after fn.
 */
export function runWithChildRequestContext<R, T extends RequestContext = RequestContext>(
  patch: Partial<T>,
  fn: () => R,
): R {
  return (getDefaultStore() as RequestContextStore<T>).runWithChild(patch, fn);
}

/**
 * Capture the current default-store context and return a function that always
 * runs fn within it. Fixes the classic ALS loss cases: EventEmitter listeners
 * that outlive the request, callbacks scheduled from other modules, queued work.
 * Outside a run, returns fn unchanged.
 */
export function bindRequestContext<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  return getDefaultStore().bind(fn);
}
