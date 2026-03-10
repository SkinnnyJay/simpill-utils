/** Interval manager types and shared noop. */
import type { TIMER_TYPE } from "./constants";

export function noop(): void {}

export type TimerType = (typeof TIMER_TYPE)[keyof typeof TIMER_TYPE];

export type TimerId = ReturnType<typeof setInterval>;

export interface TimerOptions {
  group?: string;
  ttlMs?: number;
}

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
    options?: Pick<TimerOptions, "ttlMs">,
  ) => () => void;
  createTimeout: (
    name: string,
    callback: () => void,
    timeoutMs: number,
    options?: Pick<TimerOptions, "ttlMs">,
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
}

export interface IntervalStats {
  activeIntervals: number;
  activeTimeouts: number;
  totalCreated: number;
  totalCleared: number;
  byGroup: Record<string, number>;
}
