import { useInsertionEffect, useRef } from "react";

/**
 * Returns a stable callback that always invokes the latest fn.
 * Use in effects so subscriptions don't re-run when the callback changes (Vercel rule 8.1).
 *
 * Fixes vs the previous implementation:
 * - Generic signature. The old `T extends (...args: unknown[]) => unknown`
 *   constraint rejected EVERY callback with typed parameters (TS2345 —
 *   parameters are contravariant, so `(e: MouseEvent) => void` does not extend
 *   `(...args: unknown[]) => unknown` under strict mode). Only zero-arg or
 *   `unknown`-arg callbacks compiled. Now `<Args, R>` preserves parameter and
 *   return types end to end.
 * - Latest-fn sync moved from `useEffect` to `useInsertionEffect`: the stable
 *   wrapper called from a layout effect (or anything before passive effects
 *   flush) previously invoked the PREVIOUS render's callback.
 * - `this` is forwarded (the old arrow wrapper dropped it).
 */
export function useStableCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R {
  const latest = useRef(fn);
  useInsertionEffect(() => {
    latest.current = fn;
  });
  const stableRef = useRef<((...args: Args) => R) | null>(null);
  if (stableRef.current === null) {
    stableRef.current = function stableCallback(this: unknown, ...args: Args): R {
      return latest.current.apply(this, args);
    };
  }
  return stableRef.current;
}
