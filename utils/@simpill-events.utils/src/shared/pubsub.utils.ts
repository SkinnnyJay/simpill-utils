import { noopOnError, VALUE_0 } from "./internal-constants";

export type Unsubscribe = () => void;

/** Dispatch strategy for `publishAsync`. */
export type PublishMode = "serial" | "parallel";

export interface PublishAsyncOptions {
  /** `"serial"` (default) awaits each handler in order; `"parallel"` uses `Promise.all`. */
  mode?: PublishMode;
}

export interface WaitForChannelOptions {
  /** Reject if this signal aborts before a message arrives. */
  signal?: AbortSignal;
  /** Reject after this many milliseconds. */
  timeout?: number;
}

/** Rejection reason for `waitFor` when its `timeout` elapses. */
export class ChannelWaitTimeoutError extends Error {
  readonly channel: string;
  readonly timeoutMs: number;
  constructor(channel: string, timeoutMs: number) {
    super(`Timed out after ${timeoutMs}ms waiting on channel ${channel}`);
    this.name = "ChannelWaitTimeoutError";
    this.channel = channel;
    this.timeoutMs = timeoutMs;
  }
}

export interface PubSubOptions {
  /** Called when a handler throws during publish. Default: no-op (no console). */
  onError?: (channel: string, err: unknown) => void;
}

interface Sub<T> {
  fn: (payload: T) => unknown;
  active: boolean;
}

interface ChannelState<T> {
  byHandler: Map<(payload: T) => unknown, Sub<T>>;
  /** Cached dispatch snapshot; `null` = rebuild. Never mutated in place. */
  snap: Sub<T>[] | null;
}

function hasUnref(t: unknown): t is { unref: () => void } {
  return typeof (t as { unref?: unknown })?.unref === "function";
}

export class PubSub<T = unknown> {
  private channels = new Map<string, ChannelState<T>>();
  private onError: (channel: string, err: unknown) => void;

  constructor(options?: PubSubOptions) {
    this.onError = options?.onError ?? noopOnError;
  }

  private state(channel: string): ChannelState<T> {
    let st = this.channels.get(channel);
    if (!st) {
      st = { byHandler: new Map(), snap: null };
      this.channels.set(channel, st);
    }
    return st;
  }

  subscribe(channel: string, handler: (payload: T) => void): Unsubscribe {
    const st = this.state(channel);
    st.byHandler.set(handler, { fn: handler, active: true });
    st.snap = null;
    return (): void => this.unsubscribe(channel, handler);
  }

  /** Subscribe for a single message, then auto-unsubscribe. */
  subscribeOnce(channel: string, handler: (payload: T) => void): Unsubscribe {
    const wrapper = (payload: T): void => {
      this.unsubscribe(channel, handler);
      handler(payload);
    };
    const st = this.state(channel);
    // key by ORIGINAL handler so unsubscribe(channel, handler) works
    st.byHandler.set(handler, { fn: wrapper, active: true });
    st.snap = null;
    return (): void => this.unsubscribe(channel, handler);
  }

  private unsubscribe(channel: string, handler: (payload: T) => void): void {
    const st = this.channels.get(channel);
    if (!st) return;
    const sub = st.byHandler.get(handler);
    if (!sub) return;
    sub.active = false;
    st.byHandler.delete(handler);
    st.snap = null;
    if (st.byHandler.size === VALUE_0) this.channels.delete(channel);
  }

  private snapshot(st: ChannelState<T>): Sub<T>[] {
    if (st.snap === null) st.snap = [...st.byHandler.values()];
    return st.snap;
  }

  publish(channel: string, payload: T): void {
    const st = this.channels.get(channel);
    if (!st) return;
    for (const sub of this.snapshot(st)) {
      if (!sub.active) continue;
      try {
        sub.fn(payload);
      } catch (err) {
        this.onError(channel, err);
      }
    }
  }

  /** Async publish — awaits promise-returning handlers. Rejects (AggregateError) if any fail. */
  async publishAsync(channel: string, payload: T, options?: PublishAsyncOptions): Promise<void> {
    const st = this.channels.get(channel);
    if (!st) return;
    const mode: PublishMode = options?.mode ?? "serial";
    const subs = this.snapshot(st);
    const errors: unknown[] = [];
    const run = async (sub: Sub<T>): Promise<void> => {
      if (!sub.active) return;
      try {
        await sub.fn(payload);
      } catch (err) {
        this.onError(channel, err);
        errors.push(err);
      }
    };
    if (mode === "serial") {
      for (const sub of subs) await run(sub);
    } else {
      await Promise.all(subs.map(run));
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, `${errors.length} handlers failed during publishAsync`);
    }
  }

  /** Promise that resolves with the next message on `channel`; supports abort + timeout. */
  waitFor(channel: string, options?: WaitForChannelOptions): Promise<T> {
    const signal = options?.signal;
    const timeout = options?.timeout;
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onMsg = (payload: T): void => {
        cleanup();
        resolve(payload);
      };
      const onAbort = (): void => {
        cleanup();
        reject(signal?.reason);
      };
      const cleanup = (): void => {
        this.unsubscribe(channel, onMsg);
        if (timer !== undefined) clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      this.subscribe(channel, onMsg);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (timeout !== undefined) {
        timer = setTimeout(() => {
          cleanup();
          reject(new ChannelWaitTimeoutError(channel, timeout));
        }, timeout);
        if (hasUnref(timer)) timer.unref();
      }
    });
  }

  listenerCount(channel?: string): number {
    if (channel !== undefined) {
      const st = this.channels.get(channel);
      return st?.byHandler.size ?? VALUE_0;
    }
    let total = 0;
    for (const st of this.channels.values()) total += st.byHandler.size;
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
  subscribeOnce<K extends keyof M>(channel: K, handler: (payload: M[K]) => void): Unsubscribe;
  publish<K extends keyof M>(channel: K, payload: M[K]): void;
  publishAsync<K extends keyof M>(
    channel: K,
    payload: M[K],
    options?: PublishAsyncOptions,
  ): Promise<void>;
  waitFor<K extends keyof M>(channel: K, options?: WaitForChannelOptions): Promise<M[K]>;
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
    subscribeOnce<K extends keyof M>(channel: K, handler: (payload: M[K]) => void) {
      return ps.subscribeOnce(channel as string, handler as (p: M[keyof M]) => void);
    },
    publish<K extends keyof M>(channel: K, payload: M[K]) {
      ps.publish(channel as string, payload);
    },
    publishAsync<K extends keyof M>(channel: K, payload: M[K], options?: PublishAsyncOptions) {
      return ps.publishAsync(channel as string, payload, options);
    },
    waitFor<K extends keyof M>(channel: K, options?: WaitForChannelOptions) {
      return ps.waitFor(channel as string, options) as Promise<M[K]>;
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
