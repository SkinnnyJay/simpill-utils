/**
 * One-shot store creation with optional persist and devtools (React/frontend).
 * Uses zustand create (React-bound); for vanilla/store API only use createTypedStore from shared.
 */

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { StateCreator } from "zustand/vanilla";
import type { DevtoolsOptions } from "./devtools";
import type { PersistOptions } from "./persist";

export type CreateAppStoreOptions<T> = {
  persist?: PersistOptions<T>;
  devtools?: DevtoolsOptions;
};

/**
 * Creates a Zustand store with optional persist and/or devtools in one call.
 * For React apps only (uses create from "zustand" which includes React hook).
 * Order: persist then devtools around the builder.
 */
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
