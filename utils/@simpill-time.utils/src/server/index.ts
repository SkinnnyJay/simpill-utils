export type { CancellableFunction, ThrottleOptions } from "../shared";
export { debounce, throttle } from "../shared";
export {
  createManagedDriftlessInterval,
  createManagedInterval,
  createManagedTimeout,
  createTimerFactory,
  IntervalManager,
  intervalManager,
  type TimerCreateOptions,
  type TimerFactory,
  type TimerFactoryOptions,
  type TimerOptions,
} from "./interval-manager";
