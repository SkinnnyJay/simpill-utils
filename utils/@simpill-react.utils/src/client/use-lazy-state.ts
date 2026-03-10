import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

/**
 * Typed helper for lazy useState initializer.
 * Encourages useState(() => ...) so expensive init runs only once (Vercel rule 5.6).
 *
 * @param initializer - Function that returns the initial state (run only on first render)
 */
export function useLazyState<T>(initializer: () => T): [T, Dispatch<SetStateAction<T>>] {
  return useState(initializer);
}
