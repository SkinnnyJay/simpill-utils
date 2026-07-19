import { useInsertionEffect, useRef } from "react";

/**
 * Ref-like object whose `current` always holds the latest committed value.
 * Unlike React 18's `RefObject<T>`, `current` is `T` — never `null` — so
 * consumers don't need bogus null checks (the README example itself did not
 * compile against the previous `RefObject<T>` return type under strict TS).
 */
export interface LatestRef<T> {
  readonly current: T;
}

/**
 * Returns a ref object that always holds the latest value.
 * Avoids stale closures in effects and callbacks without adding deps (Vercel rule 8.2).
 *
 * The ref is synced in `useInsertionEffect`, which React runs before all
 * layout and passive effects of the same commit. The previous implementation
 * synced in `useEffect` (after paint), so any `useLayoutEffect` — and any code
 * running before passive effects flushed — read the PREVIOUS render's value.
 * Insertion-effect syncing is the React-team-recommended timing for the
 * latest-ref pattern (it is how the official `useEffectEvent` ponyfills work)
 * and stays commit-aligned under concurrent rendering: discarded renders never
 * touch the ref.
 *
 * @example
 * const onSearchRef = useLatest(onSearch);
 * useEffect(() => {
 *   const t = setTimeout(() => onSearchRef.current(query), 300);
 *   return () => clearTimeout(t);
 * }, [query]); // onSearch not in deps
 */
export function useLatest<T>(value: T): LatestRef<T> {
  const ref = useRef(value);
  useInsertionEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
