import { noopOnError, VALUE_0 } from "./internal-constants";

export type Unsubscribe = () => void;

export interface PubSubOptions {
  /** Called when a handler throws during publish. Default: no-op (no console). */
  onError?: (channel: string, err: unknown) => void;
}

export class PubSub<T = unknown> {
  private channels = new Map<string, Set<(payload: T) => void>>();
  private onError: (channel: string, err: unknown) => void;

  constructor(options?: PubSubOptions) {
    this.onError = options?.onError ?? noopOnError;
  }

  subscribe(channel: string, handler: (payload: T) => void): Unsubscribe {
    let set = this.channels.get(channel);
    if (!set) {
      set = new Set();
      this.channels.set(channel, set);
    }
    set.add(handler);
    return (): void => {
      set?.delete(handler);
      if (set?.size === VALUE_0) this.channels.delete(channel);
    };
  }

  publish(channel: string, payload: T): void {
    const set = this.channels.get(channel);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        this.onError(channel, err);
      }
    }
  }

  listenerCount(channel?: string): number {
    if (channel !== undefined) {
      const set = this.channels.get(channel);
      return set?.size ?? VALUE_0;
    }
    let total = 0;
    for (const set of this.channels.values()) total += set.size;
    return total;
  }

  clearChannel(channel: string): void {
    this.channels.delete(channel);
  }

  clear(): void {
    this.channels.clear();
  }
}

export function createPubSub<T = unknown>(options?: PubSubOptions): PubSub<T> {
  return new PubSub<T>(options);
}

/** Channel map: channel name → payload type. Use for type-safe per-channel payloads. */
export type ChannelMap = Record<string, unknown>;

export interface TypedPubSub<M extends ChannelMap> {
  subscribe<K extends keyof M>(channel: K, handler: (payload: M[K]) => void): Unsubscribe;
  publish<K extends keyof M>(channel: K, payload: M[K]): void;
  listenerCount(channel?: keyof M): number;
  clearChannel(channel: keyof M): void;
  clear(): void;
}

/** Create a PubSub with typed channels (different payload per channel). */
export function createTypedPubSub<M extends ChannelMap>(options?: PubSubOptions): TypedPubSub<M> {
  const ps = new PubSub<M[keyof M]>(options);
  return {
    subscribe<K extends keyof M>(channel: K, handler: (payload: M[K]) => void) {
      return ps.subscribe(channel as string, handler as (p: M[keyof M]) => void);
    },
    publish<K extends keyof M>(channel: K, payload: M[K]) {
      ps.publish(channel as string, payload);
    },
    listenerCount(channel?: keyof M) {
      return ps.listenerCount(channel as string | undefined);
    },
    clearChannel(channel: keyof M) {
      ps.clearChannel(channel as string);
    },
    clear() {
      ps.clear();
    },
  };
}
