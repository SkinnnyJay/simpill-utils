import type { IInitShutdown } from "../shared/interfaces";

/**
 * Aggregates multiple shutdown-callback failures. Duck-compatible with the ES2021
 * AggregateError shape (.errors) without requiring a lib bump past ES2020.
 */
export class ShutdownAggregateError extends Error {
  readonly errors: readonly unknown[];

  constructor(errors: readonly unknown[], message: string) {
    super(message);
    this.name = "ShutdownAggregateError";
    this.errors = errors;
  }
}

export interface CreateInitShutdownOptions {
  /**
   * Order shutdown callbacks run:
   * - "fifo" (default, pre-uplift behavior): registration order
   * - "lifo": reverse registration order — the resource-teardown convention
   *   (last acquired, first released), matching test-teardown semantics.
   */
  shutdownOrder?: "fifo" | "lifo";
}

/**
 * Creates init/shutdown lifecycle manager.
 * init() is connect-once: concurrent and repeated calls share one in-flight promise
 * (calling app.lifecycle.init() from two entry points no longer runs db.connect twice);
 * a FAILED init clears the cached promise so the next call retries instead of
 * poisoning the lifecycle forever.
 * shutdown() runs ALL callbacks even when some throw (a throwing flush no longer
 * leaks every resource registered after it); a single failure rethrows the original
 * error, multiple failures throw ShutdownAggregateError. shutdown() is also idempotent.
 */
export function createInitShutdown(options: CreateInitShutdownOptions = {}): IInitShutdown {
  const initFns: Array<() => void | Promise<void>> = [];
  const shutdownFns: Array<() => void | Promise<void>> = [];
  let initPromise: Promise<void> | null = null;
  let shutdownPromise: Promise<void> | null = null;

  const runInit = async (): Promise<void> => {
    for (const fn of initFns) {
      await fn();
    }
  };

  const runShutdown = async (): Promise<void> => {
    const fns =
      options.shutdownOrder === "lifo" ? shutdownFns.slice().reverse() : shutdownFns.slice();
    const errors: unknown[] = [];
    for (const fn of fns) {
      try {
        await fn();
      } catch (err) {
        errors.push(err);
      }
    }
    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw new ShutdownAggregateError(errors, "shutdown callbacks failed");
    }
  };

  return {
    onInit(fn: () => void | Promise<void>): void {
      initFns.push(fn);
    },
    onShutdown(fn: () => void | Promise<void>): void {
      shutdownFns.push(fn);
    },
    init(): Promise<void> {
      if (initPromise === null) {
        initPromise = runInit().catch((err) => {
          initPromise = null;
          throw err;
        });
      }
      return initPromise;
    },
    shutdown(): Promise<void> {
      if (shutdownPromise === null) {
        shutdownPromise = runShutdown();
      }
      return shutdownPromise;
    },
  };
}
