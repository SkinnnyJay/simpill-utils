import * as React from "react";
import { useCallback, useInsertionEffect, useRef } from "react";
import { ERROR_EFFECT_EVENT_RENDER } from "./constants";

type AnyFunction = (...args: never[]) => unknown;

type UseEffectEvent = <Args extends unknown[], R>(fn: (...args: Args) => R) => (...args: Args) => R;

/** Native useEffectEvent (React 19.2+), resolved once at module load. */
const nativeUseEffectEvent = (React as { useEffectEvent?: <T extends AnyFunction>(fn: T) => T })
  .useEffectEvent;

function forbiddenInRender(): never {
  throw new Error(ERROR_EFFECT_EVENT_RENDER);
}

function useEffectEventPonyfill<Args extends unknown[], R>(
  fn: (...args: Args) => R
): (...args: Args) => R {
  const ref = useRef<(...args: Args) => R>(forbiddenInRender);
  useInsertionEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: Args): R => ref.current(...args), []);
}

/**
 * Ponyfill of React's `useEffectEvent` (stable since React 19.2): a function
 * that always sees the latest props/state but never re-triggers effects that
 * call it. On React 19.2+ this IS the native hook (resolved once at module
 * load, so hook order is constant for the process lifetime); on React 18/19.0
 * it is the community-standard `useInsertionEffect` ponyfill (same approach as
 * Radix UI and shadcn), which the React RFC recommends so the callback is
 * updated before any layout/passive effect of the same commit runs.
 *
 * Per React's semantics, Effect Events must not be called during render — the
 * ponyfill throws if invoked before the first commit (the closest userland
 * approximation of React's render-phase guard).
 */
export const useEffectEvent: UseEffectEvent =
  (nativeUseEffectEvent as UseEffectEvent | undefined) ?? useEffectEventPonyfill;
