/** Next state: literal S or function (context, state, event) => S. */
export type StateTransition<S extends string, E extends string, C> =
  | S
  | ((context: C | undefined, state: S, event: E) => S);

/** Map from state to partial map of event -> StateTransition. */
export type StateTransitions<S extends string, E extends string, C> = {
  [K in S]?: Partial<Record<E, StateTransition<S, E, C>>>;
};

/** Options: allowUnknown, errorMessage, onTransition. */
export type StateMachineOptions<S extends string, E extends string, C> = {
  allowUnknown?: boolean;
  errorMessage?: (state: S, event: E) => string;
  onTransition?: (next: S, prev: S, event: E, context: C | undefined) => void;
};

/** State machine API: getState, can, transition. */
export type StateMachine<S extends string, E extends string, C> = {
  getState: () => S;
  can: (event: E) => boolean;
  transition: (event: E, context?: C) => S;
};

/** Typed finite state machine with transition map; throws if transition missing and allowUnknown false. */
export function createStateMachine<S extends string, E extends string, C = undefined>(
  initialState: S,
  transitions: StateTransitions<S, E, C>,
  options?: StateMachineOptions<S, E, C>
): StateMachine<S, E, C> {
  let currentState = initialState;

  const resolveTransition = (state: S, event: E, context?: C): S | undefined => {
    const transition = transitions[state]?.[event];
    if (transition === undefined) return undefined;
    if (typeof transition === "function") {
      return transition(context, state, event);
    }
    return transition as S;
  };

  return {
    getState: () => currentState,
    can: (event) => transitions[currentState]?.[event] != null,
    transition: (event, context) => {
      const next = resolveTransition(currentState, event, context);
      if (!next) {
        if (options?.allowUnknown) {
          return currentState;
        }
        const message =
          options?.errorMessage?.(currentState, event) ?? `No transition for event: ${event}`;
        throw new Error(message);
      }
      const prev = currentState;
      currentState = next;
      options?.onTransition?.(next, prev, event, context);
      return currentState;
    },
  };
}
