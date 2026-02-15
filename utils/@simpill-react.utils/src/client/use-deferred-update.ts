import type { SetStateAction } from "react";
import { startTransition, useState } from "react";

/**
 * Returns [state, setState] where setState wraps updates in startTransition.
 * Use for non-urgent updates (e.g. scroll position) to keep UI responsive (Vercel rule 5.7).
 */
export function useDeferredUpdate<T>(initialValue: T): [T, (value: SetStateAction<T>) => void] {
  const [state, setState] = useState(initialValue);
  const setDeferred = (value: SetStateAction<T>) => {
    startTransition(() => setState(value));
  };
  return [state, setDeferred];
}
