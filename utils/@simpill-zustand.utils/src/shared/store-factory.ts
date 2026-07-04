/**
 * Typed store factory: create with full type inference (vanilla store, no React).
 */

import { createStore, type StateCreator, type StoreApi } from "zustand/vanilla";
import type { AnySliceActions, SliceState } from "./types";

/**
 * Creates a Zustand vanilla store with full type inference from the builder.
 * For React, use: import { useStore } from "zustand/react"; useStore(store, selector).
 *
 * Two forms:
 * 1. `createTypedStore((set) => ({ ... }))` — a zustand StateCreator.
 * 2. `createTypedStore(initialState, (set) => actions)` — initial state object
 *    plus an actions factory. This is the form the README always showed; it
 *    now actually exists (previously the README's primary example did not
 *    compile against the single-builder implementation).
 */
export function createTypedStore<T>(builder: StateCreator<T, [], [], T>): StoreApi<T>;
export function createTypedStore<State extends SliceState, Actions extends AnySliceActions>(
  initialState: State,
  actionsFactory: (
    set: (partial: Partial<State> | ((s: State) => Partial<State>)) => void,
    get: () => State & Actions
  ) => Actions
): StoreApi<State & Actions>;
export function createTypedStore(
  builderOrInitial: unknown,
  actionsFactory?: (set: never, get: never) => Record<string, unknown>
) {
  if (typeof actionsFactory === "function") {
    const initial = builderOrInitial as Record<string, unknown>;
    return createStore((set, get) => ({
      ...initial,
      ...actionsFactory(set as never, get as never),
    })) as never;
  }
  return createStore(builderOrInitial as StateCreator<unknown, [], [], unknown>) as never;
}

/**
 * Creates a selector that selects a slice of state. Typed helper for use with stores.
 */
export function createSelector<S, R>(selector: (state: S) => R): (state: S) => R {
  return selector;
}

/** A memoized derived selector (see createMemoSelector). */
export type MemoSelector<S, R> = ((state: S) => R) & {
  /** Number of times the combiner has run (for tests/diagnostics). */
  recomputations: () => number;
  resetRecomputations: () => void;
};

type UnionToIntersection<U> = (U extends unknown ? (u: U) => void : never) extends (
  i: infer I
) => void
  ? I
  : never;

/** State type an input-selector tuple operates over (intersection of all). */
type SelectorState<Inputs extends readonly ((state: never) => unknown)[]> = UnionToIntersection<
  Parameters<Inputs[number]>[0]
>;

/**
 * Reselect-style memoized derived selector, zero-dep. Two-tier memo:
 * 1. WeakMap state-identity fast path (like reselect v5's weakMapMemoize) —
 *    a previously seen state object returns its cached result in one lookup,
 *    without re-running input selectors. Assumes immutable-update stores
 *    (zustand's set replaces state objects; in-place mutation is already
 *    outside zustand's contract).
 * 2. Input-equality memo — on a NEW state object, input selectors run and the
 *    combiner re-runs only if some input changed by Object.is; otherwise the
 *    cached result (stable reference) is reused.
 *
 * const selectTotal = createMemoSelector(
 *   [(s: S) => s.items, (s: S) => s.taxRate],
 *   (items, taxRate) => items.reduce((a, i) => a + i.price, 0) * (1 + taxRate)
 * );
 */
export function createMemoSelector<Inputs extends readonly ((state: never) => unknown)[], R>(
  inputs: readonly [...Inputs],
  combiner: (...args: { [K in keyof Inputs]: ReturnType<Inputs[K]> }) => R
): MemoSelector<SelectorState<Inputs>, R> {
  type S = SelectorState<Inputs>;
  const n = inputs.length;
  const run = combiner as (...args: unknown[]) => R;
  const byState = new WeakMap<object, { r: R }>();
  let lastArgs: unknown[] | null = null;
  let lastResult: R;
  let recomputations = 0;
  const selector = (state: S): R => {
    const keyable = typeof state === "object" && state !== null;
    if (keyable) {
      const hit = byState.get(state as object);
      if (hit !== undefined) {
        return hit.r;
      }
    }
    const args: unknown[] = new Array(n);
    let changed = lastArgs === null;
    for (let i = 0; i < n; i++) {
      const v = (inputs[i] as (state: S) => unknown)(state);
      args[i] = v;
      if (!(changed || Object.is(v, (lastArgs as unknown[])[i]))) {
        changed = true;
      }
    }
    if (changed) {
      lastArgs = args;
      recomputations++;
      lastResult = run(...args);
    }
    if (keyable) {
      byState.set(state as object, { r: lastResult });
    }
    return lastResult;
  };
  const memo = selector as MemoSelector<S, R>;
  memo.recomputations = () => recomputations;
  memo.resetRecomputations = () => {
    recomputations = 0;
  };
  return memo;
}
