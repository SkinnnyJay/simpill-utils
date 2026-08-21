/**
 * Server exports: shared store/slices + in-memory persist adapter.
 */

// The doc comment above always promised an "in-memory persist adapter when
// needed"; it now exists.
export { createInMemoryStorage } from "../client/persist";
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
} from "../shared";
export {
  combineSlices,
  createMemoSelector,
  createSelector,
  createSlice,
  createTypedStore,
  SliceCollisionError,
} from "../shared";
