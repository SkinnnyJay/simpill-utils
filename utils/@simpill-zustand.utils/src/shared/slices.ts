/**
 * Slice composition: createSlice, combineSlices.
 */

import type { AnySliceActions, SliceActions, SliceState, StateCreator } from "./types";

export type { SliceActions, SliceState };

export type Slice<State extends SliceState, Actions extends AnySliceActions = SliceActions> = {
  getInitialState: () => State;
  actions(set: SliceSet<State>): Actions;
};

/** The scoped `set` a slice's actions receive. */
export type SliceSet<State extends SliceState> = (
  partial: Partial<State> | ((s: State) => Partial<State>)
) => void;

/**
 * Widest slice shape, usable as a variance-safe generic constraint.
 * `actions(set: never)` makes every concretely-typed Slice assignable here
 * (parameters are contravariant), which is what removes the
 * `as Slice<SliceState, SliceActions>` casts the frozen ref forced on every
 * combineSlices call site — including this package's own tests.
 */
export type AnySlice = {
  getInitialState: () => SliceState;
  actions(set: never): AnySliceActions;
};

type UnionToIntersection<U> = (U extends unknown ? (u: U) => void : never) extends (
  i: infer I
) => void
  ? I
  : never;

/** Merged state type inferred from a tuple of slices. */
export type SlicesState<Slices extends readonly AnySlice[]> = UnionToIntersection<
  { [K in keyof Slices]: ReturnType<Slices[K]["getInitialState"]> }[number]
>;

/** Merged actions type inferred from a tuple of slices. */
export type SlicesActions<Slices extends readonly AnySlice[]> = UnionToIntersection<
  { [K in keyof Slices]: ReturnType<Slices[K]["actions"]> }[number]
>;

/** Thrown by combineSlices when two slices declare the same state or action key. */
export class SliceCollisionError extends Error {
  readonly keys: string[];
  constructor(kind: "state" | "action", keys: string[]) {
    super(
      `combineSlices: duplicate ${kind} key(s) across slices: ${keys.join(", ")}. ` +
        "Colliding keys silently overwrite each other (last slice wins); rename them."
    );
    this.name = "SliceCollisionError";
    this.keys = keys;
  }
}

function deepIsolate<T>(value: T): T {
  // Slice state is documented as "record of serializable values" — structuredClone
  // is the correct isolation. Fall back to the original shallow spread only for
  // non-cloneable values (e.g. functions smuggled into state) to stay lenient.
  try {
    return structuredClone(value);
  } catch {
    return { ...(value as Record<string, unknown>) } as T;
  }
}

/**
 * Creates a named slice: initial state + action creators that receive set.
 * getInitialState returns a DEEP copy — nested objects/arrays are isolated per
 * call, so building several stores from one slice never aliases state between
 * them. (The original shallow spread shared every nested reference: mutating
 * store A's state corrupted store B.)
 */
export function createSlice<State extends SliceState, Actions extends AnySliceActions>(
  initialState: State,
  actionsFactory: (set: SliceSet<State>) => Actions
): Slice<State, Actions> {
  return {
    getInitialState: () => deepIsolate(initialState),
    actions: actionsFactory,
  };
}

/**
 * Combines multiple slices into a single state shape and actions object,
 * with FULL type inference (merged State and Actions are the intersection of
 * every slice's types — no more Record<string, unknown>).
 *
 * - Duplicate state/action keys across slices throw SliceCollisionError
 *   instead of silently last-wins overwriting.
 * - Each slice's actions receive a genuinely SCOPED set: functional updaters
 *   see only that slice's own keys (as documented), not the whole combined
 *   state.
 * - toStateCreator() returns a ready-to-use zustand StateCreator:
 *   `createStore(combineSlices(a, b).toStateCreator())`.
 */
export function combineSlices<Slices extends readonly AnySlice[]>(
  ...slices: Slices
): {
  getInitialState: () => SlicesState<Slices>;
  getActions: (set: SliceSet<SliceState>) => SlicesActions<Slices>;
  toStateCreator: () => StateCreator<
    SlicesState<Slices> & SlicesActions<Slices>,
    [],
    [],
    SlicesState<Slices> & SlicesActions<Slices>
  >;
} {
  // Eager state-key collision check (state shapes are known now).
  const keysBySlice: string[][] = slices.map((s) => Object.keys(s.getInitialState()));
  const seen = new Set<string>();
  const stateDupes = new Set<string>();
  for (const keys of keysBySlice) {
    for (const k of keys) {
      if (seen.has(k)) {
        stateDupes.add(k);
      }
      seen.add(k);
    }
  }
  if (stateDupes.size > 0) {
    throw new SliceCollisionError("state", [...stateDupes]);
  }

  const getInitialState = (): SlicesState<Slices> => {
    let state: SliceState = {};
    for (const slice of slices) {
      state = { ...state, ...slice.getInitialState() };
    }
    return state as SlicesState<Slices>;
  };

  const getActions = (set: SliceSet<SliceState>): SlicesActions<Slices> => {
    let actions: Record<string, unknown> = {};
    const actionDupes = new Set<string>();
    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const keys = keysBySlice[i];
      const sliceSet: SliceSet<SliceState> = (partial) => {
        if (typeof partial === "function") {
          // Scoped view: the updater sees only this slice's keys.
          set((full) => {
            const scoped: SliceState = {};
            for (const k of keys) {
              scoped[k] = full[k];
            }
            return partial(scoped);
          });
        } else {
          set(partial);
        }
      };
      const sliceActions = (
        slice as unknown as { actions: (set: SliceSet<SliceState>) => AnySliceActions }
      ).actions(sliceSet);
      for (const k of Object.keys(sliceActions)) {
        if (k in actions) {
          actionDupes.add(k);
        }
      }
      actions = { ...actions, ...sliceActions };
    }
    if (actionDupes.size > 0) {
      throw new SliceCollisionError("action", [...actionDupes]);
    }
    return actions as SlicesActions<Slices>;
  };

  return {
    getInitialState,
    getActions,
    toStateCreator:
      () =>
      (set: unknown): SlicesState<Slices> & SlicesActions<Slices> =>
        ({
          ...(getInitialState() as SliceState),
          ...(getActions(set as unknown as SliceSet<SliceState>) as Record<string, unknown>),
        }) as SlicesState<Slices> & SlicesActions<Slices>,
  };
}
