/**
 * @simpill/zustand.utils – Zustand store helpers for full-stack apps.
 * @see @simpill/zustand.utils/shared – store factory, slices
 * @see @simpill/zustand.utils/client – persist, devtools
 */

export type {
  CreateAppStoreOptions,
  DevtoolsOptions,
  HydratableStore,
  PersistedAppStore,
  PersistOptions,
  WithPersistOptions,
} from "./client";
export {
  createAppStore,
  createInMemoryStorage,
  createJSONStorage,
  devtools,
  getClientOnlyStorage,
  persist,
  whenHydrated,
  withDevtools,
  withPersist,
  withPersistClientOnly,
} from "./client";
export type {
  AnySliceActions,
  MemoSelector,
  Slice,
  SliceActions,
  SliceSet,
  SliceState,
  SlicesActions,
  SlicesState,
  StoreApi,
  StoreState,
} from "./shared";
export {
  combineSlices,
  createMemoSelector,
  createSelector,
  createSlice,
  createTypedStore,
  SliceCollisionError,
} from "./shared";
