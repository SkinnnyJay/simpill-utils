import { noopOnError, VALUE_0 } from "./internal-constants";

/** Event map: event key (string or symbol) → single payload type. */
export type EventMap = Record<string | symbol, unknown>;

export interface EventEmitterOptions {
  /** Called when a handler throws during emit. Default: no-op (no console). */
  onError?: (event: string | symbol, err: unknown) => void;
  /**
   * Soft per-event listener cap. When an event's listener count first exceeds
   * this, `onLeak` is called. `0` (default) disables the check. Unlike Node's
   * EventEmitter this NEVER writes to the console and NEVER throws — it is an
   * opt-in signal, not a side effect.
   */
  maxListeners?: number;
  /** Called once when an event first exceeds `maxListeners`. Default: no-op. */
  onLeak?: (event: string | symbol, count: number) => void;
}

/** Dispatch strategy for `emitAsync`. */
export type EmitMode = "serial" | "parallel";

export interface EmitAsyncOptions {
  /**
   * `"serial"` (default) awaits each handler in registration order — a slow
   * handler delays the next. `"parallel"` starts all handlers then awaits them
   * with `Promise.all`.
   */
  mode?: EmitMode;
}

export interface WaitForOptions {
  /** Reject if this signal aborts before the event fires. */
  signal?: AbortSignal;
  /** Reject after this many milliseconds if the event has not fired. */
  timeout?: number;
}

/** Rejection reason for `waitFor` when its `timeout` elapses. */
export class EventWaitTimeoutError extends Error {
  readonly event: string | symbol;
  readonly timeoutMs: number;
  constructor(event: string | symbol, timeoutMs: number) {
    super(`Timed out after ${timeoutMs}ms waiting for event ${String(event)}`);
    this.name = "EventWaitTimeoutError";
    this.event = event;
    this.timeoutMs = timeoutMs;
  }
}

/** Handler receiving every event (name + payload), registered via `onAny`. */
export type AnyHandler<M extends EventMap> = (event: keyof M, payload: M[keyof M]) => unknown;

export interface TypedEventEmitter<M extends EventMap> {
  on<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void;
  once<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void;
  off<K extends keyof M>(event: K, handler: (payload: M[K]) => void): void;
  /** Synchronous dispatch. Returns `true` if the event had any listener. */
  emit<K extends keyof M>(event: K, payload: M[K]): boolean;
  /** Async dispatch — awaits promise-returning handlers. Rejects (AggregateError) if any throw/reject. */
  emitAsync<K extends keyof M>(event: K, payload: M[K], options?: EmitAsyncOptions): Promise<void>;
  /** Subscribe to every event. Returns an unsubscribe function. */
  onAny(handler: AnyHandler<M>): () => void;
  offAny(handler: AnyHandler<M>): void;
  /** Promise that resolves with the next payload for `event`; supports abort + timeout. */
  waitFor<K extends keyof M>(event: K, options?: WaitForOptions): Promise<M[K]>;
  listenerCount(event?: keyof M): number;
  clear(event?: keyof M): void;
  setMaxListeners(n: number): void;
  getMaxListeners(): number;
}

/** Erased handler type so handlers for different events share one map. */
type ErasedHandler<M extends EventMap> = (payload: M[keyof M]) => unknown;

interface Record_<M extends EventMap> {
  fn: ErasedHandler<M>;
  active: boolean;
}

interface Channel<M extends EventMap> {
  byHandler: Map<ErasedHandler<M>, Record_<M>>;
  /** Cached dispatch snapshot; `null` = rebuild on next emit. Never mutated in place. */
  snap: Record_<M>[] | null;
  leaked: boolean;
}

interface AnyRecord<M extends EventMap> {
  fn: AnyHandler<M>;
  active: boolean;
}

function hasUnref(t: unknown): t is { unref: () => void } {
  return typeof (t as { unref?: unknown })?.unref === "function";
}

export class EventEmitter<M extends EventMap> implements TypedEventEmitter<M> {
  private channels = new Map<keyof M, Channel<M>>();
  private anyListeners = new Map<AnyHandler<M>, AnyRecord<M>>();
  private anySnap: AnyRecord<M>[] | null = null;
  private onError: (event: string | symbol, err: unknown) => void;
  private onLeak: (event: string | symbol, count: number) => void;
  private maxListeners: number;

  constructor(options?: EventEmitterOptions) {
    this.onError = options?.onError ?? noopOnError;
    this.onLeak = options?.onLeak ?? (() => {});
    this.maxListeners = options?.maxListeners ?? VALUE_0;
  }

  private channel(event: keyof M): Channel<M> {
    let ch = this.channels.get(event);
    if (!ch) {
      ch = { byHandler: new Map(), snap: null, leaked: false };
      this.channels.set(event, ch);
    }
    return ch;
  }

  private register(event: keyof M, key: ErasedHandler<M>, fn: ErasedHandler<M>): void {
    const ch = this.channel(event);
    ch.byHandler.set(key, { fn, active: true });
    ch.snap = null;
    if (this.maxListeners > VALUE_0 && !ch.leaked && ch.byHandler.size > this.maxListeners) {
      ch.leaked = true;
      this.onLeak(event as string | symbol, ch.byHandler.size);
    }
  }

  on<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void {
    const key = handler as ErasedHandler<M>;
    this.register(event, key, key);
    return (): void => this.off(event, handler);
  }

  once<K extends keyof M>(event: K, handler: (payload: M[K]) => void): () => void {
    const key = handler as ErasedHandler<M>;
    const wrapper: ErasedHandler<M> = (payload): void => {
      this.off(event, handler); // remove by ORIGINAL handler → off(original) works
      (handler as (p: M[K]) => void)(payload as M[K]);
    };
    this.register(event, key, wrapper);
    return (): void => this.off(event, handler);
  }

  off<K extends keyof M>(event: K, handler: (payload: M[K]) => void): void {
    const ch = this.channels.get(event);
    if (!ch) return;
    const key = handler as ErasedHandler<M>;
    const rec = ch.byHandler.get(key);
    if (!rec) return;
    rec.active = false; // tombstone: an in-flight dispatch skips it
    ch.byHandler.delete(key);
    ch.snap = null;
    if (ch.leaked && ch.byHandler.size <= this.maxListeners) ch.leaked = false;
    if (ch.byHandler.size === VALUE_0) this.channels.delete(event);
  }

  private snapshot(ch: Channel<M>): Record_<M>[] {
    if (ch.snap === null) ch.snap = [...ch.byHandler.values()];
    return ch.snap;
  }

  private anySnapshot(): AnyRecord<M>[] {
    if (this.anySnap === null) this.anySnap = [...this.anyListeners.values()];
    return this.anySnap;
  }

  emit<K extends keyof M>(event: K, payload: M[K]): boolean {
    let had = false;
    const ch = this.channels.get(event);
    if (ch) {
      const snap = this.snapshot(ch);
      had = snap.length > VALUE_0;
      for (const rec of snap) {
        if (!rec.active) continue;
        try {
          rec.fn(payload as M[keyof M]);
        } catch (err) {
          this.onError(event as string | symbol, err);
        }
      }
    }
    if (this.anyListeners.size > VALUE_0) {
      for (const rec of this.anySnapshot()) {
        if (!rec.active) continue;
        had = true;
        try {
          rec.fn(event, payload as M[keyof M]);
        } catch (err) {
          this.onError(event as string | symbol, err);
        }
      }
    }
    return had;
  }

  async emitAsync<K extends keyof M>(
    event: K,
    payload: M[K],
    options?: EmitAsyncOptions,
  ): Promise<void> {
    const mode: EmitMode = options?.mode ?? "serial";
    const ch = this.channels.get(event);
    const recs = ch ? this.snapshot(ch) : [];
    const anyRecs = this.anyListeners.size > VALUE_0 ? this.anySnapshot() : [];
    const errors: unknown[] = [];

    const runSpecific = async (rec: Record_<M>): Promise<void> => {
      if (!rec.active) return;
      try {
        await rec.fn(payload as M[keyof M]);
      } catch (err) {
        this.onError(event as string | symbol, err);
        errors.push(err);
      }
    };
    const runAny = async (rec: AnyRecord<M>): Promise<void> => {
      if (!rec.active) return;
      try {
        await rec.fn(event, payload as M[keyof M]);
      } catch (err) {
        this.onError(event as string | symbol, err);
        errors.push(err);
      }
    };

    if (mode === "serial") {
      for (const rec of recs) await runSpecific(rec);
      for (const rec of anyRecs) await runAny(rec);
    } else {
      await Promise.all([...recs.map(runSpecific), ...anyRecs.map(runAny)]);
    }

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, `${errors.length} listeners failed during emitAsync`);
    }
  }

  onAny(handler: AnyHandler<M>): () => void {
    this.anyListeners.set(handler, { fn: handler, active: true });
    this.anySnap = null;
    return (): void => this.offAny(handler);
  }

  offAny(handler: AnyHandler<M>): void {
    const rec = this.anyListeners.get(handler);
    if (!rec) return;
    rec.active = false;
    this.anyListeners.delete(handler);
    this.anySnap = null;
  }

  waitFor<K extends keyof M>(event: K, options?: WaitForOptions): Promise<M[K]> {
    const signal = options?.signal;
    const timeout = options?.timeout;
    return new Promise<M[K]>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onEvent = (payload: M[K]): void => {
        cleanup();
        resolve(payload);
      };
      const onAbort = (): void => {
        cleanup();
        reject(signal?.reason);
      };
      const cleanup = (): void => {
        this.off(event, onEvent as (p: M[K]) => void);
        if (timer !== undefined) clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      this.on(event, onEvent as (p: M[K]) => void);
      signal?.addEventListener("abort", onAbort, { once: true });
      if (timeout !== undefined) {
        timer = setTimeout(() => {
          cleanup();
          reject(new EventWaitTimeoutError(event as string | symbol, timeout));
        }, timeout);
        if (hasUnref(timer)) timer.unref();
      }
    });
  }

  listenerCount(event?: keyof M): number {
    if (event !== undefined) {
      const ch = this.channels.get(event);
      return ch?.byHandler.size ?? VALUE_0;
    }
    let total = 0;
    for (const ch of this.channels.values()) total += ch.byHandler.size;
    return total;
  }

  clear(event?: keyof M): void {
    if (event !== undefined) {
      this.channels.delete(event);
    } else {
      this.channels.clear();
      this.anyListeners.clear();
      this.anySnap = null;
    }
  }

  setMaxListeners(n: number): void {
    this.maxListeners = n < VALUE_0 ? VALUE_0 : n;
  }

  getMaxListeners(): number {
    return this.maxListeners;
  }
}

export function createEventEmitter<M extends EventMap>(
  options?: EventEmitterOptions,
): EventEmitter<M> {
  return new EventEmitter<M>(options);
}
