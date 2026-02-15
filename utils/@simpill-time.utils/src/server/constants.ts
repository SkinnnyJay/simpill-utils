/** Server-only constants for interval-manager (literal audit). */

export const TIMER_TYPE_INTERVAL = "interval" as const;
export const TIMER_TYPE_TIMEOUT = "timeout" as const;
export const TIMER_TYPE = {
  INTERVAL: TIMER_TYPE_INTERVAL,
  TIMEOUT: TIMER_TYPE_TIMEOUT,
} as const;

export const TIMER_ID_PREFIX_INTERVAL = "interval_";
export const TIMER_ID_PREFIX_TIMEOUT = "timeout_";
export const TIMER_ID_PREFIX_FACTORY = "factory_";

export const DEFAULT_GROUP_UNGROUPED = "ungrouped";
export const DEFAULT_GROUP_TIMERS = "timers";

export const TIMER_FACTORY_DESTROYED_ERROR = "TimerFactory has been destroyed";

export const DESTROY_REASON_MANUAL = "manual" as const;
export const DESTROY_REASON_IDLE_TTL = "idle-ttl" as const;
