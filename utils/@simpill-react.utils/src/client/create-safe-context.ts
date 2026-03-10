import {
  type Context,
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import {
  DEFAULT_DISPLAY_NAME,
  ERROR_USE_CTX_OUTSIDE_PREFIX,
  ERROR_USE_CTX_OUTSIDE_SUFFIX,
  ERROR_USE_SAFE_CONTEXT_OUTSIDE_PROVIDER,
} from "./constants";

export interface SafeContextResult<T> {
  Provider: (props: { value: T; children: ReactNode }) => ReactNode;
  useCtx: () => T;
}

/**
 * Creates a context plus a hook that throws if used outside the provider.
 * Returns { Provider, useCtx } for type-safe context consumption.
 *
 * @param displayName - Optional display name for debugging
 */
export function createSafeContext<T>(displayName?: string): SafeContextResult<T> {
  const name = displayName ?? DEFAULT_DISPLAY_NAME;
  const Ctx = createContext<T | null>(null);
  (Ctx as { displayName?: string }).displayName = name;

  function Provider(props: { value: T; children: ReactNode }) {
    const { value, children } = props;
    const valueRef = useMemo(() => value, [value]);
    return createElement(Ctx.Provider, { value: valueRef }, children);
  }

  function useCtx(): T {
    const value = useContext(Ctx);
    if (value === null) {
      throw new Error(ERROR_USE_CTX_OUTSIDE_PREFIX + name + ERROR_USE_CTX_OUTSIDE_SUFFIX);
    }
    return value;
  }

  return { Provider, useCtx };
}

/**
 * Hook that returns the context value or throws if outside provider.
 * Use when you already have a context from createSafeContext.
 */
export function useSafeContext<T>(context: Context<T | null>): T {
  const value = useContext(context);
  if (value === null) {
    throw new Error(ERROR_USE_SAFE_CONTEXT_OUTSIDE_PROVIDER);
  }
  return value;
}
