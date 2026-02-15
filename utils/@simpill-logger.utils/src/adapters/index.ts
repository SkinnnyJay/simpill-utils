/**
 * @file Adapters Index
 * @description Optional logger adapters for various logging backends
 *
 * These adapters provide different logging destinations and can be composed together.
 *
 * @example
 * ```typescript
 * // File adapter for disk logging
 * import { FileLoggerAdapter } from "@simpill/logger.utils/adapters";
 *
 * // Multi-transport for multiple destinations
 * import { MultiTransportAdapter, FileLoggerAdapter } from "@simpill/logger.utils/adapters";
 * import { SimpleLoggerAdapter } from "@simpill/logger.utils/shared";
 *
 * configureLoggerFactory({
 *   adapter: new MultiTransportAdapter([
 *     new SimpleLoggerAdapter(),
 *     new FileLoggerAdapter({ directory: "./logs" }),
 *   ]),
 * });
 *
 * // Pino adapter (requires 'pino' package)
 * import { PinoLoggerAdapter } from "@simpill/logger.utils/adapters";
 * ```
 */

// File-based logging with rotation
export { createFileAdapter, FileLoggerAdapter, type FileLoggerConfig } from "./file.adapter";

// Multi-transport composition
export { createMultiAdapter, MultiTransportAdapter } from "./multi.adapter";

// Third-party integrations
export { createPinoAdapter, type PinoLike, PinoLoggerAdapter } from "./pino.adapter";
