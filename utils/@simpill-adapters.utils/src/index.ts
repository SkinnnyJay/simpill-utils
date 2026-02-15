/**
 * @simpill/adapters.utils – Adapter helpers, logger and cache interfaces.
 */
export type { CacheAdapter, LoggerAdapter } from "./shared";
export {
  consoleLoggerAdapter,
  createAdapter,
  memoryCacheAdapter,
} from "./shared";
