import { noopOnError } from "./internal-constants";

export type Listener<T> = (value: T) => void;

export interface ObservableLike<T> {
  getValue(): T;
  subscribe(listener: Listener<T>): () => void;
}

export interface SubscribeOptions {
  /** If true, invoke the listener immediately with the current value. Default: false. */
  emitOnSubscribe?: boolean;
}

export interface ObservableOptions {
  /** Called when a listener throws. Default: no-op (no console). */
  onError?: (err: unknown) => void;
}

export class Observable<T> {
  private value: T;
  private listeners = new Set<Listener<T>>();
  private onError: (err: unknown) => void;

  constructor(initial: T, options?: ObservableOptions) {
    this.value = initial;
    this.onError = options?.onError ?? noopOnError;
  }

  getValue(): T {
    return this.value;
  }

  /** Alias for getValue(). */
  get(): T {
    return this.getValue();
  }

  setValue(next: T): void {
    if (Object.is(this.value, next)) return;
    this.value = next;
    for (const fn of this.listeners) {
      try {
        fn(next);
      } catch (err) {
        this.onError(err);
      }
    }
  }

  /** Alias for setValue(). */
  set(next: T): void {
    this.setValue(next);
  }

  /** Update value using a function. */
  update(fn: (current: T) => T): void {
    this.setValue(fn(this.value));
  }

  subscribe(listener: Listener<T>, options?: SubscribeOptions): () => void {
    this.listeners.add(listener);
    if (options?.emitOnSubscribe) {
      try {
        listener(this.value);
      } catch (err) {
        this.onError(err);
      }
    }
    return (): void => {
      this.listeners.delete(listener);
    };
  }
}

export function createObservable<T>(initial: T, options?: ObservableOptions): Observable<T> {
  return new Observable(initial, options);
}
