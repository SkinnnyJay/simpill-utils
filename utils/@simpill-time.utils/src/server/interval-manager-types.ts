/** Interval manager types and shared noop. */
import type { TIMER_TYPE } from "./constants";

export function noop(): void {}

export type TimerType = (typeof TIMER_TYPE)[keyof typeof TIMER_TYPE];

export type TimerId = ReturnType<typeof setInterval>;

export interface TimerOptions {
  group?: string;
  ttlMs?: number;
  /** Unref the underlying timer(s) so they never keep the process alive. */
  unref?: boolean;
  /** AbortSignal that clears the timer when aborted. */
  signal?: AbortSignal;
  /** Called when the callback throws. Default: swallow (back-compat). */
  onError?: (error: unknown, info: { id: string; name: string; type: TimerType }) => void;
}

export type TimerCreateOptions = Pick<TimerOptions, "ttlMs" | "unref" | "signal" | "onError">;

export interface TimerFactoryOptions {
  group?: string;
  defaultTtlMs?: number;
  idleTtlMs?: number;
}

export interface TimerFactory {
  createInterval: (
    name: string,
    callback: () => void,
    intervalMs: number,
    options?: TimerCreateOptions,
  ) => () => void;
  createTimeout: (
    name: string,
    callback: () => void,
    timeoutMs: number,
    options?: TimerCreateOptions,
  ) => () => void;
  createDriftlessInterval: (
    name: string,
    callback: () => void,
    intervalMs: number,
    options?: TimerCreateOptions,
  ) => () => void;
  destroy: (reason?: "manual" | "idle-ttl") => number;
  getGroup: () => string;
  isDestroyed: () => boolean;
}

export interface ManagedInterval {
  id: TimerId;
  name: string;
  group?: string;
  createdAt: number;
  intervalMs: number;
  type: TimerType;
  ttlMs?: number;
  ttlId?: ReturnType<typeof setTimeout> | null;
  /** Removes the AbortSignal listener when the timer is cleared. */
  abortCleanup?: (() => void) | null;
}

export interface IntervalStats {
  activeIntervals: number;
  activeTimeouts: number;
  totalCreated: number;
  totalCleared: number;
  /** Timeouts that fired naturally (ran to completion, not cleared). */
  totalFired: number;
  byGroup: Record<string, number>;
}
