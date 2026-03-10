import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/**
 * Returns a ref object that always holds the latest value.
 * Avoids stale closures in effects and callbacks without adding deps (Vercel rule 8.2).
 *
 * @example
 * const onSearchRef = useLatest(onSearch);
 * useEffect(() => {
 *   const t = setTimeout(() => onSearchRef.current(query), 300);
 *   return () => clearTimeout(t);
 * }, [query]); // onSearch not in deps
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref as RefObject<T>;
}
