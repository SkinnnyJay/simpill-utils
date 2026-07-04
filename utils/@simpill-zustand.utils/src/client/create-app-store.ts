/**
 * One-shot store creation with optional persist and devtools (React/frontend).
 * Uses zustand create (React-bound); for vanilla/store API only use createTypedStore from shared.
 */

import { create, type Mutate, type StoreApi, type UseBoundStore } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { StateCreator } from "zustand/vanilla";
import type { DevtoolsOptions } from "./devtools";
import type { PersistOptions } from "./persist";

export type CreateAppStoreOptions<T> = {
  persist?: PersistOptions<T>;
  devtools?: DevtoolsOptions;
};

/** Store type carrying the persist middleware API (store.persist.*). */
export type PersistedAppStore<T> = UseBoundStore<Mutate<StoreApi<T>, [["zustand/persist", T]]>>;

/**
 * Creates a Zustand store with optional persist and/or devtools in one call.
 * For React apps only (uses create from "zustand" which includes React hook).
 * Order: devtools wraps persist wraps the builder (zustand's recommended order).
 *
 * When persist options are given, the RETURN TYPE now includes the persist
 * API — `useStore.persist.rehydrate()` / `.hasHydrated()` /
 * `.onFinishHydration()` type-check without casts. (The original asserted the
 * store back to a bare UseBoundStore<StoreApi<T>>, erasing an API that exists
 * at runtime.)
 */
export function createAppStore<T>(
  builder: StateCreator<T, [], [], T>,
  options: CreateAppStoreOptions<T> & { persist: PersistOptions<T> }
): PersistedAppStore<T>;
export function createAppStore<T>(
  builder: StateCreator<T, [], [], T>,
  options?: CreateAppStoreOptions<T>
): UseBoundStore<StoreApi<T>>;
export function createAppStore<T>(
  builder: StateCreator<T, [], [], T>,
  options?: CreateAppStoreOptions<T>
): UseBoundStore<StoreApi<T>> {
  // Middleware typing is complex; compose at runtime and assert final type
  let stateCreator: unknown = builder;
  if (options?.persist) {
    stateCreator = persist(stateCreator as never, options.persist as never);
  }
  if (options?.devtools) {
    stateCreator = devtools(stateCreator as never, options.devtools as never);
  }
  return create(stateCreator as StateCreator<T, [], [], T>) as UseBoundStore<StoreApi<T>>;
}
