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
      for (const observer of observers) {
        observer(event);
      }
    },
    clear: () => {
      observers.clear();
    },
    getObserverCount: () => observers.size,
  };
}
