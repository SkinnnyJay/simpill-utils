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

interface Sub<T> {
  fn: Listener<T>;
  active: boolean;
}

export class Observable<T> {
  private value: T;
  private subs = new Map<Listener<T>, Sub<T>>();
  /** Cached notify snapshot; `null` = rebuild. Never mutated in place. */
  private snap: Sub<T>[] | null = null;
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
    if (this.snap === null) this.snap = [...this.subs.values()];
    for (const sub of this.snap) {
      if (!sub.active) continue;
      try {
        sub.fn(next);
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
    this.subs.set(listener, { fn: listener, active: true });
    this.snap = null;
    if (options?.emitOnSubscribe) {
      try {
        listener(this.value);
      } catch (err) {
        this.onError(err);
      }
    }
    return (): void => {
      const sub = this.subs.get(listener);
      if (!sub) return;
      sub.active = false; // tombstone: an in-flight notify skips it
      this.subs.delete(listener);
      this.snap = null;
    };
  }

  /** Number of active subscribers. */
  listenerCount(): number {
    return this.subs.size;
  }
}

export function createObservable<T>(initial: T, options?: ObservableOptions): Observable<T> {
  return new Observable(initial, options);
}
