/**
 * Shared types for store and slice helpers.
 */

import type { StateCreator, StoreApi } from "zustand/vanilla";

export type { StateCreator, StoreApi };

export type StoreState<S> = S extends StoreApi<infer T> ? T : never;

/** State shape for a slice (record of serializable values). */
export type SliceState = Record<string, unknown>;

/** Actions for a slice (record of functions). */
export type SliceActions = Record<string, (...args: unknown[]) => undefined | unknown>;

/**
 * Loose action-record bound. `(...args: never[]) => unknown` is the standard
 * "any function" supertype under strictFunctionTypes, so naturally typed
 * actions like `(n: number) => void` satisfy it WITHOUT casts.
 * (The original `SliceActions` bound forced `as Slice<SliceState, SliceActions>`
 * casts in every call site — including this package's own tests.)
 */
export type AnySliceActions = Record<string, (...args: never[]) => unknown>;
