/**
 * Typed store factory: create with full type inference (vanilla store, no React).
 */

import { createStore, type StateCreator, type StoreApi } from "zustand/vanilla";

/**
 * Creates a Zustand vanilla store with full type inference from the builder.
 * For React, use: import { useStore } from "zustand/react"; useStore(store, selector).
 */
export function createTypedStore<T>(builder: StateCreator<T, [], [], T>): StoreApi<T> {
  return createStore(builder);
}

/**
 * Creates a selector that selects a slice of state. Typed helper for use with stores.
 */
export function createSelector<S, R>(selector: (state: S) => R): (state: S) => R {
  return selector;
}
