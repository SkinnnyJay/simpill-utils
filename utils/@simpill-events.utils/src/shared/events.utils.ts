import { noopOnError, VALUE_0 } from "./internal-constants";

/** Event map: event key (string or symbol) → single payload type. */
export type EventMap = Record<string | symbol, unknown>;

export interface EventEmitterOptions {
  /** Called when a handler throws during emit. Default: no-op (no console). */
  onError?: (event: string | symbol, err: unknown) => void;
}

export interface TypedEventEmitter<M extends EventMap> {
  on<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void;
  once<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void;
  off<K extends keyof M>(event: K, handler: (payload: M[K]) => void): void;
  emit<K extends keyof M>(event: K, payload: M[K]): void;
  listenerCount(event?: keyof M): number;
  clear(event?: keyof M): void;
}

type HandlerWrapper = (p: unknown) => void;

/** Internal: map key type erases K so we can store handlers from different events in one Map. */
function asMapKey<K extends keyof M, M extends EventMap>(
  h: (p: M[K]) => void,
): (p: M[keyof M]) => void {
  return h as (p: M[keyof M]) => void;
}

export class EventEmitter<M extends EventMap> implements TypedEventEmitter<M> {
  private channels = new Map<keyof M, Map<(p: M[keyof M]) => void, HandlerWrapper>>();
  private onError: (event: string | symbol, err: unknown) => void;

  constructor(options?: EventEmitterOptions) {
    this.onError = options?.onError ?? noopOnError;
  }

  on<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void {
    let map = this.channels.get(event);
    if (!map) {
      map = new Map();
      this.channels.set(event, map);
    }
    const wrapper: HandlerWrapper = (p: unknown): void => handler(p as M[K]);
    map.set(asMapKey(handler), wrapper);
    return (): void => this.off(event, handler);
  }

  once<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void {
    const onceWrapper = (payload: M[K]): void => {
      this.off(event, onceWrapper as (p: M[K]) => void);
      handler(payload);
    };
    return this.on(event, onceWrapper);
  }

  off<K extends keyof M>(event: K, handler: (payload: M[K]) => void): void {
    const map = this.channels.get(event);
    if (!map) return;
    map.delete(asMapKey(handler));
    if (map.size === VALUE_0) this.channels.delete(event);
  }

  emit<K extends keyof M>(event: K, payload: M[K]): void {
    const map = this.channels.get(event);
    if (!map) return;
    for (const wrapper of map.values()) {
      try {
        wrapper(payload);
      } catch (err) {
        this.onError(event as string | symbol, err);
      }
    }
  }

  listenerCount(event?: keyof M): number {
    if (event !== undefined) {
      const map = this.channels.get(event);
      return map?.size ?? VALUE_0;
    }
    let total = 0;
    for (const map of this.channels.values()) total += map.size;
    return total;
  }

  clear(event?: keyof M): void {
    if (event !== undefined) {
      this.channels.delete(event);
    } else {
      this.channels.clear();
    }
  }
}

export function createEventEmitter<M extends EventMap>(
  options?: EventEmitterOptions,
): EventEmitter<M> {
  return new EventEmitter<M>(options);
}
