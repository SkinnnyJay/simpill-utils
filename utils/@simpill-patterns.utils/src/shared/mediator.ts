/** Handler invoked with event payload. */
export type MediatorHandler<T> = (payload: T) => void;

/** Typed event hub: on, off, emit, clear, listenerCount. */
export type Mediator<TEvents extends Record<string, unknown>> = {
  on: <K extends keyof TEvents>(event: K, handler: MediatorHandler<TEvents[K]>) => () => void;
  off: <K extends keyof TEvents>(event: K, handler: MediatorHandler<TEvents[K]>) => void;
  emit: <K extends keyof TEvents>(event: K, payload: TEvents[K]) => void;
  clear: () => void;
  listenerCount: <K extends keyof TEvents>(event: K) => number;
};

/** Typed event hub with on, off, emit, clear, listenerCount. */
export function createMediator<TEvents extends Record<string, unknown>>(): Mediator<TEvents> {
  const handlers = new Map<keyof TEvents, Set<MediatorHandler<unknown>>>();

  const getSet = <K extends keyof TEvents>(event: K): Set<MediatorHandler<unknown>> => {
    let set = handlers.get(event);
    if (!set) {
      set = new Set<MediatorHandler<unknown>>();
      handlers.set(event, set);
    }
    return set;
  };

  return {
    on: (event, handler) => {
      const set = getSet(event);
      set.add(handler as MediatorHandler<unknown>);
      return () => {
        set.delete(handler as MediatorHandler<unknown>);
      };
    },
    off: (event, handler) => {
      const set = handlers.get(event);
      if (!set) return;
      set.delete(handler as MediatorHandler<unknown>);
    },
    emit: (event, payload) => {
      const set = handlers.get(event);
      if (!set) return;
      // Delivery isolation (see observer.ts): every handler runs even if an
      // earlier one throws; the first error is rethrown after the loop.
      let firstError: unknown;
      let errored = false;
      for (const handler of set) {
        try {
          (handler as MediatorHandler<unknown>)(payload);
        } catch (e) {
          if (!errored) {
            firstError = e;
            errored = true;
          }
        }
      }
      if (errored) throw firstError;
    },
    clear: () => {
      handlers.clear();
    },
    listenerCount: (event) => handlers.get(event)?.size ?? 0,
  };
}
