import { type Context, createContext, createElement, type ReactNode, useContext } from "react";
import {
  DEFAULT_DISPLAY_NAME,
  ERROR_USE_CTX_OUTSIDE_PREFIX,
  ERROR_USE_CTX_OUTSIDE_SUFFIX,
  ERROR_USE_SAFE_CONTEXT_OUTSIDE_PROVIDER,
} from "./constants";

/**
 * Private sentinel for "no provider above". Using a unique symbol instead of
 * `null` means contexts typed to include `null` (or `undefined`) work: the
 * previous implementation used `null` as the sentinel, so
 * `createSafeContext<string | null>()` THREW inside its own Provider whenever
 * the provided value was a legitimate `null`.
 */
const UNSET = Symbol("simpill.react.safe-context.unset");

export interface SafeContextResult<T> {
  Provider: (props: { value: T; children: ReactNode }) => ReactNode;
  useCtx: () => T;
  /** Returns the context value, or `undefined` when no Provider is above (never throws). */
  useMaybeCtx: () => T | undefined;
}

/**
 * Creates a context plus a hook that throws if used outside the provider.
 * Returns { Provider, useCtx, useMaybeCtx } for type-safe context consumption.
 *
 * Notes vs the previous implementation:
 * - `null`/`undefined` are now valid provided values (symbol sentinel).
 * - Removed a no-op `useMemo(() => value, [value])` in Provider — it returned
 *   its dependency unchanged and memoized nothing.
 *
 * @param displayName - Optional display name for debugging
 */
export function createSafeContext<T>(displayName?: string): SafeContextResult<T> {
  const name = displayName ?? DEFAULT_DISPLAY_NAME;
  const Ctx = createContext<T | typeof UNSET>(UNSET);
  Ctx.displayName = name;

  function Provider(props: { value: T; children: ReactNode }) {
    return createElement(Ctx.Provider, { value: props.value }, props.children);
  }

  function useCtx(): T {
    const value = useContext(Ctx);
    if (value === UNSET) {
      throw new Error(ERROR_USE_CTX_OUTSIDE_PREFIX + name + ERROR_USE_CTX_OUTSIDE_SUFFIX);
    }
    return value;
  }

  function useMaybeCtx(): T | undefined {
    const value = useContext(Ctx);
    return value === UNSET ? undefined : value;
  }

  return { Provider, useCtx, useMaybeCtx };
}

/**
 * Hook that returns the context value or throws if outside provider.
 * Use when you already have a context from `createContext<T | null>(null)`.
 * (`null` is this hook's documented sentinel; for null-safe contexts use
 * `createSafeContext` instead.)
 */
export function useSafeContext<T>(context: Context<T | null>): T {
  const value = useContext(context);
  if (value === null) {
    throw new Error(ERROR_USE_SAFE_CONTEXT_OUTSIDE_PROVIDER);
  }
  return value;
}
