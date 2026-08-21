import {
  clearLogContextProvider,
  hasLogContextProvider,
  type LogContext,
  setLogContextProvider,
} from "@simpill/logger.utils";
import { getRequestContext } from "@simpill/request-context.utils/server";

/** Options for {@link setupObservability}. */
export interface SetupObservabilityOptions {
  /** When true (default), sets logger's context provider to getRequestContext() */
  setLogContextProvider?: boolean;
  /**
   * Static fields (service name, env, version, region, …) merged into every
   * log entry's context. Request-scoped fields win on key conflicts. Applied
   * even outside a request, so process-level logs are enriched too.
   */
  baseContext?: LogContext;
  /**
   * Extra dynamic context composed on every log call — e.g. a bridge that
   * reads the active OpenTelemetry span. Merged between baseContext and the
   * request context (request context wins on key conflicts). Errors thrown
   * here are swallowed by the logger's context read, never by the log call.
   */
  extendContext?: () => LogContext | undefined;
  /**
   * What to do when some other log context provider is already installed:
   * - "replace" (default; matches previous behavior): overwrite it.
   * - "keep": leave the existing provider untouched and return an inactive handle.
   * - "throw": throw an Error so double-wiring fails loudly.
   */
  onExistingProvider?: "replace" | "keep" | "throw";
}

/** Handle returned by {@link setupObservability}. */
export interface ObservabilityHandle {
  /** True while this setup's provider is (as far as this package knows) the active one. */
  readonly active: boolean;
  /** True when this setup overwrote a provider that was already installed. */
  readonly replacedExistingProvider: boolean;
  /**
   * Remove this setup's provider from the logger. No-op when this handle is
   * no longer the active one (e.g. a later setupObservability() superseded it),
   * so stale teardowns can't clobber newer wiring from this package.
   */
  teardown(): void;
}

/**
 * The handle whose provider is currently installed by this package.
 * Lets a superseding setupObservability() neutralize older handles' teardown,
 * and lets teardown avoid clearing wiring it no longer owns.
 */
let activeHandle: ObservabilityHandle | null = null;

function createHandle(installed: boolean, replacedExistingProvider: boolean): ObservabilityHandle {
  let active = installed;
  const handle: ObservabilityHandle = {
    get active(): boolean {
      return active;
    },
    replacedExistingProvider,
    teardown(): void {
      if (!active) return;
      active = false;
      if (activeHandle === handle) {
        activeHandle = null;
        clearLogContextProvider();
      }
    },
  };
  return handle;
}

/**
 * Wires request context into the logger so all logs in a request
 * automatically include requestId, traceId, etc.
 * Call once at app startup (e.g. after importing logger and request-context).
 *
 * Returns a handle for tests and hot-reload paths: `teardown()` uninstalls the
 * provider, `replacedExistingProvider` reports whether an existing provider was
 * overwritten (previously this happened silently).
 */
export function setupObservability(options?: SetupObservabilityOptions): ObservabilityHandle {
  if (options?.setLogContextProvider === false) {
    return createHandle(false, false);
  }

  const hadProvider = hasLogContextProvider();

  if (hadProvider) {
    const behavior = options?.onExistingProvider ?? "replace";
    if (behavior === "keep") {
      return createHandle(false, false);
    }
    if (behavior === "throw") {
      throw new Error(
        "setupObservability: a log context provider is already installed " +
          '(pass onExistingProvider: "replace" or "keep" to resolve explicitly)'
      );
    }
  }

  const baseContext = options?.baseContext ? { ...options.baseContext } : undefined;
  const extendContext = options?.extendContext;

  let provider: () => LogContext | undefined;
  if (!baseContext && !extendContext) {
    // Fast path — identical wiring to the original implementation.
    provider = getRequestContext;
  } else {
    provider = () => {
      const requestContext = getRequestContext();
      const extra = extendContext?.();
      if (!extra && !requestContext) return baseContext;
      return { ...baseContext, ...extra, ...requestContext };
    };
  }

  setLogContextProvider(provider);

  // Supersede any prior handle from this package so its teardown becomes a no-op.
  if (activeHandle) {
    const superseded = activeHandle;
    activeHandle = null;
    superseded.teardown();
  }
  const handle = createHandle(true, hadProvider);
  activeHandle = handle;
  return handle;
}
