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
