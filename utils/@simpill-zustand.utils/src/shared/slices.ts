/**
 * Slice composition: createSlice, combineSlices.
 */

import type { SliceActions, SliceState } from "./types";

export type { SliceActions, SliceState };

export type Slice<State extends SliceState, Actions extends SliceActions> = {
  getInitialState: () => State;
  actions: (set: (partial: Partial<State> | ((s: State) => Partial<State>)) => void) => Actions;
};

/**
 * Creates a named slice: initial state + action creators that receive set.
 */
export function createSlice<State extends SliceState, Actions extends SliceActions>(
  initialState: State,
  actionsFactory: (
    set: (partial: Partial<State> | ((s: State) => Partial<State>)) => void
  ) => Actions
): Slice<State, Actions> {
  return {
    getInitialState: () => ({ ...initialState }) as State,
    actions: actionsFactory,
  };
}

/**
 * Combines multiple slices into a single state shape and actions object.
 * Each slice's getInitialState is merged and each slice's actions are called with a scoped set.
 */
export function combineSlices<Slices extends Slice<SliceState, SliceActions>[]>(
  ...slices: Slices
): {
  getInitialState: () => SliceState;
  getActions: (
    set: (partial: Partial<SliceState> | ((s: SliceState) => Partial<SliceState>)) => void
  ) => SliceActions;
} {
  return {
    getInitialState: () => {
      let state: SliceState = {};
      for (const slice of slices) {
        state = { ...state, ...slice.getInitialState() };
      }
      return state;
    },
    getActions: (set) => {
      let actions: SliceActions = {};
      for (const slice of slices) {
        const sliceSet = (
          partial: Partial<SliceState> | ((s: SliceState) => Partial<SliceState>)
        ) => {
          set(partial);
        };
        actions = { ...actions, ...slice.actions(sliceSet) };
      }
      return actions;
    },
  };
}
