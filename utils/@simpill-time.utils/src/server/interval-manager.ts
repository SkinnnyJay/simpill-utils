/** Interval/timeout manager with process shutdown cleanup (Node). Callbacks no-op by default. */
import {
  DEFAULT_GROUP_TIMERS,
  DEFAULT_GROUP_UNGROUPED,
  DESTROY_REASON_IDLE_TTL,
  DESTROY_REASON_MANUAL,
  SHUTDOWN_SIGNALS,
  TIMER_FACTORY_DESTROYED_ERROR,
  TIMER_ID_PREFIX_DRIFTLESS,
  TIMER_ID_PREFIX_FACTORY,
  TIMER_ID_PREFIX_INTERVAL,
  TIMER_ID_PREFIX_TIMEOUT,
  TIMER_TYPE,
} from "./constants";
import type {
  IntervalStats,
  ManagedInterval,
  TimerCreateOptions,
  TimerFactory,
  TimerFactoryOptions,
  TimerOptions,
} from "./interval-manager-types";
import { noop } from "./interval-manager-types";

export type {
  TimerCreateOptions,
  TimerFactory,
  TimerFactoryOptions,
  TimerOptions,
} from "./interval-manager-types";

/** Monotonic-when-available clock; falls back to wall clock. */
function now(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function maybeUnref(timer: ReturnType<typeof setTimeout>, unref?: boolean): void {
  if (unref && typeof (timer as { unref?: () => void }).unref === "function") {
    (timer as unknown as { unref: () => void }).unref();
  }
}

class IntervalManager {
  private intervals: Map<string, ManagedInterval> = new Map();
  private counter = 0;
  private stats = { totalCreated: 0, totalCleared: 0, totalFired: 0 };
  private shutdownRegistered = false;
  private signalCleanups: Array<[NodeJS.Signals | "beforeExit", () => void]> = [];

  setInterval(
    name: string,
    callback: () => void,
    intervalMs: number,
    groupOrOptions?: string | TimerOptions,
  ): string {
    const options = this.normalizeTimerOptions(groupOrOptions);
    const uniqueId = `${TIMER_ID_PREFIX_INTERVAL}${++this.counter}_${name}`;
    const onError = options.onError ?? noop;
    const timerId = setInterval(() => {
      try {
        callback();
      } catch (error) {
        onError(error, { id: uniqueId, name, type: TIMER_TYPE.INTERVAL });
      }
    }, intervalMs);
    maybeUnref(timerId, options.unref);
    this.track(
      uniqueId,
      {
        id: timerId,
        name,
        group: options.group,
        createdAt: Date.now(),
        intervalMs,
        type: TIMER_TYPE.INTERVAL,
        ttlMs: options.ttlMs,
        ttlId: null,
        abortCleanup: null,
      },
      options,
    );
    return uniqueId;
  }

  setTimeout(
    name: string,
    callback: () => void,
    timeoutMs: number,
    groupOrOptions?: string | TimerOptions,
  ): string {
    const options = this.normalizeTimerOptions(groupOrOptions);
    const uniqueId = `${TIMER_ID_PREFIX_TIMEOUT}${++this.counter}_${name}`;
    const onError = options.onError ?? noop;
    const timerId = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        onError(error, { id: uniqueId, name, type: TIMER_TYPE.TIMEOUT });
      } finally {
        this.untrackFired(uniqueId);
      }
    }, timeoutMs);
    maybeUnref(timerId, options.unref);
    this.track(
      uniqueId,
      {
        id: timerId,
        name,
        group: options.group,
        createdAt: Date.now(),
        intervalMs: timeoutMs,
        type: TIMER_TYPE.TIMEOUT,
        ttlMs: options.ttlMs,
        ttlId: null,
        abortCleanup: null,
      },
      options,
    );
    return uniqueId;
  }

  /**
   * Drift-corrected repeating timer. Each tick is scheduled against the
   * original start time (tick N targets start + N*intervalMs), so per-tick
   * event-loop lateness does not accumulate the way it does with native
   * setInterval. If the loop stalls past one or more whole ticks, missed
   * ticks are skipped (no burst catch-up).
   */
  setDriftlessInterval(
    name: string,
    callback: () => void,
    intervalMs: number,
    groupOrOptions?: string | TimerOptions,
  ): string {
    const options = this.normalizeTimerOptions(groupOrOptions);
    const uniqueId = `${TIMER_ID_PREFIX_DRIFTLESS}${++this.counter}_${name}`;
    const onError = options.onError ?? noop;
    const start = now();
    let tick = 0;

    const managed: ManagedInterval = {
      id: undefined as unknown as ManagedInterval["id"],
      name,
      group: options.group,
      createdAt: Date.now(),
      intervalMs,
      type: TIMER_TYPE.INTERVAL,
      ttlMs: options.ttlMs,
      ttlId: null,
      abortCleanup: null,
    };

    const schedule = (): void => {
      tick += 1;
      const target = start + tick * intervalMs;
      const delay = Math.max(0, target - now());
      const timerId = setTimeout(() => {
        try {
          callback();
        } catch (error) {
          onError(error, { id: uniqueId, name, type: TIMER_TYPE.INTERVAL });
        }
        // Skip whole missed ticks instead of firing a burst to catch up.
        const elapsed = now() - start;
        if (elapsed > (tick + 1) * intervalMs) {
          tick = Math.floor(elapsed / intervalMs);
        }
        if (this.intervals.get(uniqueId) === managed) {
          schedule();
        }
      }, delay);
      maybeUnref(timerId, options.unref);
      managed.id = timerId;
    };

    schedule();
    this.track(uniqueId, managed, options);
    return uniqueId;
  }

  /** Shared bookkeeping: registry, TTL timer, AbortSignal wiring, shutdown hooks. */
  private track(uniqueId: string, managed: ManagedInterval, options: TimerOptions): void {
    this.intervals.set(uniqueId, managed);
    if (options.ttlMs && options.ttlMs > 0) {
      managed.ttlId = setTimeout(() => {
        this.clearInterval(uniqueId);
      }, options.ttlMs);
      // TTL reaper must never keep the process alive on its own when the
      // main timer is unref'd.
      maybeUnref(managed.ttlId, options.unref);
    }
    if (options.signal) {
      if (options.signal.aborted) {
        this.clearInterval(uniqueId);
      } else {
        const signal = options.signal;
        const onAbort = (): void => {
          this.clearInterval(uniqueId);
        };
        signal.addEventListener("abort", onAbort, { once: true });
        managed.abortCleanup = () => signal.removeEventListener("abort", onAbort);
      }
    }
    this.stats.totalCreated++;
    // Lazy: no signal handlers are installed until the first timer exists,
    // and they are re-installed after a clearAll().
    this.registerShutdownHandlers();
  }

  /** A timeout fired naturally: release bookkeeping without counting a clear. */
  private untrackFired(uniqueId: string): void {
    const managed = this.intervals.get(uniqueId);
    if (!managed) return;
    if (managed.ttlId) {
      clearTimeout(managed.ttlId);
    }
    if (managed.abortCleanup) {
      managed.abortCleanup();
    }
    this.intervals.delete(uniqueId);
    this.stats.totalFired++;
  }

  private release(managed: ManagedInterval): void {
    if (managed.type === TIMER_TYPE.INTERVAL) {
      clearInterval(managed.id);
      // Driftless intervals ride chained timeouts under an interval type;
      // clearTimeout and clearInterval are interchangeable in Node, but be
      // explicit for other runtimes.
      clearTimeout(managed.id);
    } else {
      clearTimeout(managed.id);
    }
    if (managed.ttlId) {
      clearTimeout(managed.ttlId);
    }
    if (managed.abortCleanup) {
      managed.abortCleanup();
    }
  }

  clearInterval(uniqueId: string): boolean {
    const managed = this.intervals.get(uniqueId);
    if (!managed) return false;
    this.release(managed);
    this.intervals.delete(uniqueId);
    this.stats.totalCleared++;
    return true;
  }

  clearTimeout(uniqueId: string): boolean {
    return this.clearInterval(uniqueId);
  }

  clearGroup(group: string): number {
    let cleared = 0;
    for (const [id, managed] of this.intervals.entries()) {
      if (managed.group === group) {
        this.release(managed);
        this.intervals.delete(id);
        this.stats.totalCleared++;
        cleared++;
      }
    }
    return cleared;
  }

  clearAll(): number {
    let cleared = 0;
    for (const [id, managed] of this.intervals.entries()) {
      this.release(managed);
      this.intervals.delete(id);
      this.stats.totalCleared++;
      cleared++;
    }
    this.unregisterShutdownHandlers();
    return cleared;
  }

  getStats(): IntervalStats {
    const byGroup: Record<string, number> = {};
    let activeIntervals = 0;
    let activeTimeouts = 0;
    for (const managed of this.intervals.values()) {
      if (managed.type === TIMER_TYPE.INTERVAL) activeIntervals++;
      else activeTimeouts++;
      const groupName = managed.group ?? DEFAULT_GROUP_UNGROUPED;
      byGroup[groupName] = (byGroup[groupName] ?? 0) + 1;
    }
    return {
      activeIntervals,
      activeTimeouts,
      totalCreated: this.stats.totalCreated,
      totalCleared: this.stats.totalCleared,
      totalFired: this.stats.totalFired,
      byGroup,
    };
  }

  /**
   * Whether the timer still holds the event loop open.
   * Returns undefined for unknown ids or runtimes without Timeout#hasRef.
   */
  hasRef(uniqueId: string): boolean | undefined {
    const managed = this.intervals.get(uniqueId);
    if (!managed) return undefined;
    const handle = managed.id as unknown as { hasRef?: () => boolean };
    return typeof handle.hasRef === "function" ? handle.hasRef() : undefined;
  }

  listActive(): Array<{
    id: string;
    name: string;
    group?: string;
    type: (typeof TIMER_TYPE)[keyof typeof TIMER_TYPE];
    ageMs: number;
  }> {
    const nowMs = Date.now();
    return Array.from(this.intervals.entries()).map(([id, managed]) => ({
      id,
      name: managed.name,
      group: managed.group,
      type: managed.type,
      ageMs: nowMs - managed.createdAt,
    }));
  }

  /**
   * Install cleanup hooks. Signal handlers re-raise the signal after cleanup
   * when no other listener remains, so the process still terminates with the
   * default disposition (exit code 128+signum). Without the re-raise, merely
   * importing this module would make SIGTERM/SIGINT no-ops and the process
   * unkillable short of SIGKILL.
   */
  private registerShutdownHandlers(): void {
    if (this.shutdownRegistered) return;
    const proc = typeof process !== "undefined" ? process : undefined;
    if (!proc?.on || typeof (proc as NodeJS.Process).off !== "function") return;

    for (const signal of SHUTDOWN_SIGNALS) {
      const onSignal = (): void => {
        this.clearAll(); // also removes our listeners via unregisterShutdownHandlers
        if (proc.listenerCount(signal) === 0) {
          // No one else is handling this signal: restore default behavior.
          proc.kill(proc.pid, signal);
        }
        // Otherwise the app has its own handler (already queued for this
        // emission) and owns the exit decision.
      };
      proc.on(signal, onSignal);
      this.signalCleanups.push([signal, onSignal]);
    }

    const onBeforeExit = (): void => {
      this.clearAll();
    };
    proc.on("beforeExit", onBeforeExit);
    this.signalCleanups.push(["beforeExit", onBeforeExit]);
    this.shutdownRegistered = true;
  }

  private unregisterShutdownHandlers(): void {
    if (!this.shutdownRegistered) return;
    const proc = typeof process !== "undefined" ? process : undefined;
    if (proc && typeof (proc as NodeJS.Process).off === "function") {
      for (const [event, handler] of this.signalCleanups) {
        (proc as NodeJS.Process).off(event as NodeJS.Signals, handler);
      }
    }
    this.signalCleanups = [];
    this.shutdownRegistered = false;
  }

  private normalizeTimerOptions(groupOrOptions?: string | TimerOptions): TimerOptions {
    if (typeof groupOrOptions === "string") {
      return { group: groupOrOptions };
    }
    return groupOrOptions ?? {};
  }
}

export const intervalManager = new IntervalManager();

export function createManagedInterval(
  name: string,
  callback: () => void,
  intervalMs: number,
  groupOrOptions?: string | TimerOptions,
): () => void {
  const id = intervalManager.setInterval(name, callback, intervalMs, groupOrOptions);
  return () => intervalManager.clearInterval(id);
}

export function createManagedTimeout(
  name: string,
  callback: () => void,
  timeoutMs: number,
  groupOrOptions?: string | TimerOptions,
): () => void {
  const id = intervalManager.setTimeout(name, callback, timeoutMs, groupOrOptions);
  return () => intervalManager.clearTimeout(id);
}

export function createManagedDriftlessInterval(
  name: string,
  callback: () => void,
  intervalMs: number,
  groupOrOptions?: string | TimerOptions,
): () => void {
  const id = intervalManager.setDriftlessInterval(name, callback, intervalMs, groupOrOptions);
  return () => intervalManager.clearInterval(id);
}

export { IntervalManager };

let factoryCounter = 0;

export function createTimerFactory(options: TimerFactoryOptions = {}): TimerFactory {
  const group = `${TIMER_ID_PREFIX_FACTORY}${++factoryCounter}_${options.group ?? DEFAULT_GROUP_TIMERS}`;
  const defaultTtlMs = options.defaultTtlMs;
  const idleTtlMs = options.idleTtlMs;
  let destroyed = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleIdleDestroy = (): void => {
    if (!idleTtlMs || idleTtlMs <= 0) return;
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    idleTimer = setTimeout(() => {
      destroy(DESTROY_REASON_IDLE_TTL);
    }, idleTtlMs);
  };

  const ensureActive = (): void => {
    if (destroyed) {
      throw new Error(TIMER_FACTORY_DESTROYED_ERROR);
    }
  };

  const destroy = (_reason: "manual" | "idle-ttl" = DESTROY_REASON_MANUAL): number => {
    if (destroyed) return 0;
    destroyed = true;
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    const cleared = intervalManager.clearGroup(group);
    return cleared;
  };

  const withGroup = (createOptions?: TimerCreateOptions): TimerOptions => ({
    ...createOptions,
    group,
    ttlMs: createOptions?.ttlMs ?? defaultTtlMs,
  });

  return {
    createInterval: (
      name: string,
      callback: () => void,
      intervalMs: number,
      createOptions?: TimerCreateOptions,
    ) => {
      ensureActive();
      scheduleIdleDestroy();
      const id = intervalManager.setInterval(name, callback, intervalMs, withGroup(createOptions));
      return () => intervalManager.clearInterval(id);
    },
    createTimeout: (
      name: string,
      callback: () => void,
      timeoutMs: number,
      createOptions?: TimerCreateOptions,
    ) => {
      ensureActive();
      scheduleIdleDestroy();
      const id = intervalManager.setTimeout(name, callback, timeoutMs, withGroup(createOptions));
      return () => intervalManager.clearTimeout(id);
    },
    createDriftlessInterval: (
      name: string,
      callback: () => void,
      intervalMs: number,
      createOptions?: TimerCreateOptions,
    ) => {
      ensureActive();
      scheduleIdleDestroy();
      const id = intervalManager.setDriftlessInterval(
        name,
        callback,
        intervalMs,
        withGroup(createOptions),
      );
      return () => intervalManager.clearInterval(id);
    },
    destroy,
    getGroup: () => group,
    isDestroyed: () => destroyed,
  };
}
