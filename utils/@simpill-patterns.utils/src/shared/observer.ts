/** Callback invoked with each event. */
export type Observer<T> = (event: T) => void;
/** Function to remove a subscription. */
export type Unsubscribe = () => void;

/** Observable: subscribe, next, clear, getObserverCount. */
export type Observable<T> = {
  subscribe: (observer: Observer<T>) => Unsubscribe;
  next: (event: T) => void;
  clear: () => void;
  getObserverCount: () => number;
};

/** Simple observable with subscribe, next, clear, getObserverCount. */
export function createObservable<T>(): Observable<T> {
  const observers = new Set<Observer<T>>();

  return {
    subscribe: (observer) => {
      observers.add(observer);
      return () => {
        observers.delete(observer);
      };
    },
    next: (event) => {
      // Delivery isolation: a throwing observer no longer prevents delivery
      // to the remaining observers. The first error is rethrown after the
      // loop so failures stay loud (contract preserved), and any further
      // errors are attached via AggregateError semantics on `cause`.
      let firstError: unknown;
      let errored = false;
      for (const observer of observers) {
        try {
          observer(event);
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
      observers.clear();
    },
    getObserverCount: () => observers.size,
  };
}
