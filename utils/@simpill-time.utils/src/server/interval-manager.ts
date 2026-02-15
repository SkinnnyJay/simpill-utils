/** Interval/timeout manager with process shutdown cleanup (Node). Callbacks no-op by default. */
import {
  DEFAULT_GROUP_TIMERS,
  DEFAULT_GROUP_UNGROUPED,
  DESTROY_REASON_IDLE_TTL,
  DESTROY_REASON_MANUAL,
  TIMER_FACTORY_DESTROYED_ERROR,
  TIMER_ID_PREFIX_FACTORY,
  TIMER_ID_PREFIX_INTERVAL,
  TIMER_ID_PREFIX_TIMEOUT,
  TIMER_TYPE,
} from "./constants";
import type {
  IntervalStats,
  ManagedInterval,
  TimerFactory,
  TimerFactoryOptions,
  TimerOptions,
} from "./interval-manager-types";
import { noop } from "./interval-manager-types";

export type { TimerFactory, TimerFactoryOptions, TimerOptions } from "./interval-manager-types";

class IntervalManager {
  private intervals: Map<string, ManagedInterval> = new Map();
  private counter = 0;
  private stats = { totalCreated: 0, totalCleared: 0 };
  private shutdownRegistered = false;
  private shutdownCleanup: (() => void) | null = null;

  constructor() {
    this.registerShutdownHandlers();
  }

  setInterval(
    name: string,
    callback: () => void,
    intervalMs: number,
    groupOrOptions?: string | TimerOptions,
  ): string {
    const options = this.normalizeTimerOptions(groupOrOptions);
    const uniqueId = `${TIMER_ID_PREFIX_INTERVAL}${++this.counter}_${name}`;
    const timerId = setInterval(() => {
      try {
        callback();
      } catch (error) {
        noop();
      }
    }, intervalMs);

    const managed: ManagedInterval = {
      id: timerId,
      name,
      group: options.group,
      createdAt: Date.now(),
      intervalMs,
      type: TIMER_TYPE.INTERVAL,
      ttlMs: options.ttlMs,
      ttlId: null,
    };
    this.intervals.set(uniqueId, managed);
    if (options.ttlMs && options.ttlMs > 0) {
      managed.ttlId = setTimeout(() => {
        this.clearInterval(uniqueId);
      }, options.ttlMs);
    }
    this.stats.totalCreated++;
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
    const timerId = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        noop();
      } finally {
        const managed = this.intervals.get(uniqueId);
        if (managed?.ttlId) {
          clearTimeout(managed.ttlId);
        }
        this.intervals.delete(uniqueId);
      }
    }, timeoutMs);

    const managed: ManagedInterval = {
      id: timerId,
      name,
      group: options.group,
      createdAt: Date.now(),
      intervalMs: timeoutMs,
      type: TIMER_TYPE.TIMEOUT,
      ttlMs: options.ttlMs,
      ttlId: null,
    };
    this.intervals.set(uniqueId, managed);
    if (options.ttlMs && options.ttlMs > 0) {
      managed.ttlId = setTimeout(() => {
        this.clearTimeout(uniqueId);
      }, options.ttlMs);
    }
    this.stats.totalCreated++;
    return uniqueId;
  }

  clearInterval(uniqueId: string): boolean {
    const managed = this.intervals.get(uniqueId);
    if (!managed) return false;
    if (managed.type === TIMER_TYPE.INTERVAL) clearInterval(managed.id);
    else clearTimeout(managed.id);
    if (managed.ttlId) {
      clearTimeout(managed.ttlId);
    }
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
        if (managed.type === TIMER_TYPE.INTERVAL) clearInterval(managed.id);
        else clearTimeout(managed.id);
        if (managed.ttlId) {
          clearTimeout(managed.ttlId);
        }
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
      if (managed.type === TIMER_TYPE.INTERVAL) clearInterval(managed.id);
      else clearTimeout(managed.id);
      if (managed.ttlId) {
        clearTimeout(managed.ttlId);
      }
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
      byGroup,
    };
  }

  listActive(): Array<{
    id: string;
    name: string;
    group?: string;
    type: (typeof TIMER_TYPE)[keyof typeof TIMER_TYPE];
    ageMs: number;
  }> {
    const now = Date.now();
    return Array.from(this.intervals.entries()).map(([id, managed]) => ({
      id,
      name: managed.name,
      group: managed.group,
      type: managed.type,
      ageMs: now - managed.createdAt,
    }));
  }

  private registerShutdownHandlers(): void {
    if (this.shutdownRegistered) return;
    const proc = typeof process !== "undefined" ? process : undefined;
    if (proc?.on && typeof (proc as NodeJS.Process).off === "function") {
      const cleanup = (): void => {
        const cleared = this.clearAll();
        if (cleared > 0) noop();
      };
      this.shutdownCleanup = cleanup;
      proc.on("SIGTERM", cleanup);
      proc.on("SIGINT", cleanup);
      proc.on("beforeExit", cleanup);
      this.shutdownRegistered = true;
    }
  }

  private unregisterShutdownHandlers(): void {
    if (!this.shutdownRegistered || !this.shutdownCleanup) return;
    const proc = typeof process !== "undefined" ? process : undefined;
    if (proc && typeof (proc as NodeJS.Process).off === "function") {
      (proc as NodeJS.Process).off("SIGTERM", this.shutdownCleanup);
      (proc as NodeJS.Process).off("SIGINT", this.shutdownCleanup);
      (proc as NodeJS.Process).off("beforeExit", this.shutdownCleanup);
      this.shutdownCleanup = null;
      this.shutdownRegistered = false;
    }
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

  return {
    createInterval: (
      name: string,
      callback: () => void,
      intervalMs: number,
      createOptions?: Pick<TimerOptions, "ttlMs">,
    ) => {
      ensureActive();
      scheduleIdleDestroy();
      const ttlMs = createOptions?.ttlMs ?? defaultTtlMs;
      const id = intervalManager.setInterval(name, callback, intervalMs, { group, ttlMs });
      return () => intervalManager.clearInterval(id);
    },
    createTimeout: (
      name: string,
      callback: () => void,
      timeoutMs: number,
      createOptions?: Pick<TimerOptions, "ttlMs">,
    ) => {
      ensureActive();
      scheduleIdleDestroy();
      const ttlMs = createOptions?.ttlMs ?? defaultTtlMs;
      const id = intervalManager.setTimeout(name, callback, timeoutMs, { group, ttlMs });
      return () => intervalManager.clearTimeout(id);
    },
    destroy,
    getGroup: () => group,
    isDestroyed: () => destroyed,
  };
}
