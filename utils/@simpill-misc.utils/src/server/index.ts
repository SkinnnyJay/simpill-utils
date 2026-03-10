/**
 * Re-exports from canonical packages. Implementation lives in:
 * - @simpill/object.utils (BoundedArray, BoundedLRUMap)
 * - @simpill/time.utils (IntervalManager, timers)
 * - @simpill/async.utils (PollingManager)
 */

export {
  PollingManager,
  type PollingOptions,
  type PollingState,
} from "@simpill/async.utils";
export {
  BoundedArray,
  type BoundedArrayLogger,
  type BoundedArrayOptions,
  type BoundedArrayStats,
  BoundedLRUMap,
  type BoundedLRUMapLogger,
  type BoundedLRUMapOptions,
  type BoundedLRUMapStats,
} from "@simpill/object.utils";
export {
  createManagedInterval,
  createManagedTimeout,
  createTimerFactory,
  IntervalManager,
  intervalManager,
  type TimerFactory,
  type TimerFactoryOptions,
  type TimerOptions,
} from "@simpill/time.utils";
