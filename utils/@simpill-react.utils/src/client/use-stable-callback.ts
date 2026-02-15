import { useRef } from "react";
import { useLatest } from "./use-latest";

/**
 * Returns a stable callback that always invokes the latest fn.
 * Use in effects so subscriptions don't re-run when the callback changes (Vercel rule 8.1).
 * Implemented via useLatest so the returned function reference is stable.
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const latest = useLatest(fn);
  const stableRef = useRef<T | null>(null);
  if (stableRef.current === null) {
    stableRef.current = ((...args: unknown[]) => (latest.current as T)(...args)) as T;
  }
  return stableRef.current;
}
