export type { CancellableFunction, ThrottleOptions } from "../shared";
export { debounce, throttle } from "../shared";
export {
  createManagedInterval,
  createManagedTimeout,
  createTimerFactory,
  IntervalManager,
  intervalManager,
  type TimerFactory,
  type TimerFactoryOptions,
  type TimerOptions,
} from "./interval-manager";
