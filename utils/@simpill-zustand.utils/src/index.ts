/**
 * @simpill/zustand.utils – Zustand store helpers for full-stack apps.
 * @see @simpill/zustand.utils/shared – store factory, slices
 * @see @simpill/zustand.utils/client – persist, devtools
 */

export type { CreateAppStoreOptions, DevtoolsOptions, PersistOptions } from "./client";
export {
  createAppStore,
  createJSONStorage,
  devtools,
  getClientOnlyStorage,
  persist,
  withDevtools,
  withPersist,
  withPersistClientOnly,
} from "./client";
export type { Slice, SliceActions, SliceState, StoreApi, StoreState } from "./shared";
export {
  combineSlices,
  createSelector,
  createSlice,
  createTypedStore,
} from "./shared";
