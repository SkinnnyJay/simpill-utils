import type { IInitShutdown } from "../shared/interfaces";

/** Creates init/shutdown lifecycle manager. */
export function createInitShutdown(): IInitShutdown {
  const initFns: Array<() => void | Promise<void>> = [];
  const shutdownFns: Array<() => void | Promise<void>> = [];

  return {
    onInit(fn: () => void | Promise<void>): void {
      initFns.push(fn);
    },
    onShutdown(fn: () => void | Promise<void>): void {
      shutdownFns.push(fn);
    },
    async init(): Promise<void> {
      for (const fn of initFns) {
        await Promise.resolve(fn());
      }
    },
    async shutdown(): Promise<void> {
      for (const fn of shutdownFns) {
        await Promise.resolve(fn());
      }
    },
  };
}
