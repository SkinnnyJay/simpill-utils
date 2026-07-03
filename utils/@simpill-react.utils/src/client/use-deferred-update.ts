import type { SetStateAction } from "react";
import { useCallback, useState, useTransition } from "react";

/**
 * Returns [state, setState, isPending] where setState wraps updates in a
 * transition. Use for non-urgent updates (e.g. scroll position) to keep UI
 * responsive (Vercel rule 5.7).
 *
 * Fixes vs the previous implementation:
 * - The setter is now identity-stable across renders (like React's own
 *   `useState` setter). Previously a new function was allocated every render,
 *   so putting it in a dependency array re-ran the effect on every render.
 * - Exposes `isPending` (from `useTransition`) as an optional third tuple
 *   element — existing `[state, setState]` destructuring is unaffected.
 */
export function useDeferredUpdate<T>(
  initialValue: T
): [T, (value: SetStateAction<T>) => void, boolean] {
  const [state, setState] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const setDeferred = useCallback((value: SetStateAction<T>) => {
    startTransition(() => {
      setState(value);
    });
    // startTransition from useTransition is identity-stable per React docs.
  }, []);
  return [state, setDeferred, isPending];
}
