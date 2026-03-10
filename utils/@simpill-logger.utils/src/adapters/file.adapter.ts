/**
 * @file File Logger Adapter
 * @description Disk-based logger with rotation support
 * @runtime Node.js only (requires fs module)
 *
 * Uses synchronous file I/O (appendFileSync, statSync, renameSync). Under high
 * log throughput this can block the event loop. For high-throughput scenarios,
 * wrap with BufferedLoggerAdapter so writes are batched and the file adapter
 * receives fewer, larger flushes.
 *
 * @example
 * ```typescript
 * import { FileLoggerAdapter } from "@simpill/logger.utils/adapters";
 * import { BufferedLoggerAdapter } from "@simpill/logger.utils/shared";
 * import { configureLoggerFactory } from "@simpill/logger.utils";
 *
 * const fileAdapter = new FileLoggerAdapter({
 *   directory: "./logs",
 *   maxFileSize: 5 * 1024 * 1024,  // 5MB
 *   maxFiles: 3,
 * });
 * configureLoggerFactory({
 *   adapter: new BufferedLoggerAdapter(fileAdapter, { maxBufferSize: 100 }),
 * });
 * ```
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { LoggerAdapter, LoggerAdapterConfig } from "../shared/adapter";
import { FILE_TRANSPORT_DEFAULTS, LOG_LEVEL, type LogLevel } from "../shared/constants";
import type { LogEntry, LogMetadata } from "../shared/types";
import { LOG_LEVEL_PRIORITY } from "../shared/types";

/**
 * Configuration for the file logger adapter
 */
export interface FileLoggerConfig {
  /** Directory to write log files (default: "./logs") */
  directory?: string;
  /** Filename for combined log (default: "combined.log") */
  combinedFilename?: string;
  /** Filename for error-only log (default: "error.log") */
  errorFilename?: string;
  /** Maximum file size in bytes before rotation (default: 10MB) */
  maxFileSize?: number;
  /** Number of rotated files to keep (default: 5) */
  maxFiles?: number;
  /** Output format: "json" for structured, "pretty" for human-readable (default: "json") */
  format?: "json" | "pretty";
}

/**
 * Resolved configuration with all defaults applied
 */
interface ResolvedFileLoggerConfig {
  directory: string;
  combinedFilename: string;
  errorFilename: string;
  maxFileSize: number;
  maxFiles: number;
  format: "json" | "pretty";
}

/**
 * File logger adapter - writes logs to disk with rotation support
 *
 * Features:
 * - Writes all log levels to combined.log
 * - Writes ERROR level to error.log
 * - Rotates files when maxFileSize is exceeded
 * - Creates log directory if it doesn't exist
 * - Supports JSON and pretty output formats
 *
 * Performance: uses synchronous file I/O. For high-throughput logging, wrap
 * this adapter with BufferedLoggerAdapter to batch writes and reduce blocking.
 */
export class FileLoggerAdapter implements LoggerAdapter {
  private config: ResolvedFileLoggerConfig;
  private minLevel: LogLevel = LOG_LEVEL.DEBUG;
  private name = "";
  private defaultMetadata?: LogMetadata;
  private initialized = false;

  /**
   * Create a new FileLoggerAdapter
   *
   * @param fileConfig - File-specific configuration
   */
  constructor(fileConfig?: FileLoggerConfig) {
    this.config = this.resolveConfig(fileConfig);
  }

  /**
   * Resolve configuration with defaults
   */
  private resolveConfig(config?: FileLoggerConfig): ResolvedFileLoggerConfig {
    return {
      directory: config?.directory ?? FILE_TRANSPORT_DEFAULTS.DIRECTORY,
      combinedFilename: config?.combinedFilename ?? FILE_TRANSPORT_DEFAULTS.COMBINED_FILENAME,
      errorFilename: config?.errorFilename ?? FILE_TRANSPORT_DEFAULTS.ERROR_FILENAME,
      maxFileSize: config?.maxFileSize ?? FILE_TRANSPORT_DEFAULTS.MAX_FILE_SIZE,
      maxFiles: config?.maxFiles ?? FILE_TRANSPORT_DEFAULTS.MAX_FILES,
      format: config?.format ?? "json",
    };
  }

  /**
   * Initialize the adapter with configuration
   */
  initialize(config: LoggerAdapterConfig): void {
    if (config.minLevel) {
      this.minLevel = config.minLevel;
    }

    // Ensure log directory exists
    this.ensureDirectoryExists();
    this.initialized = true;
  }

  /**
   * Ensure the log directory exists, creating it if necessary
   */
  private ensureDirectoryExists(): void {
    const dir = path.resolve(this.config.directory);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Check if a log level should be output based on minimum level
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  /**
   * Get the full path for a log file
   */
  private getFilePath(filename: string): string {
    return path.resolve(this.config.directory, filename);
  }

  /**
   * Format a log entry for file output
   */
  private formatEntry(entry: LogEntry): string {
    const mergedEntry: LogEntry = {
      ...entry,
      name: entry.name || this.name,
      timestamp: entry.timestamp ?? new Date().toISOString(),
      metadata: this.defaultMetadata
        ? { ...this.defaultMetadata, ...entry.metadata }
        : entry.metadata,
    };

    if (this.config.format === "json") {
      return JSON.stringify({
        timestamp: mergedEntry.timestamp,
        level: mergedEntry.level,
        name: mergedEntry.name,
        message: mergedEntry.message,
        ...mergedEntry.metadata,
      });
    }

    // Pretty format
    const timestamp = mergedEntry.timestamp;
    const level = mergedEntry.level.padEnd(5);
    const name = mergedEntry.name ? `[${mergedEntry.name}]` : "";
    const meta = mergedEntry.metadata ? ` ${JSON.stringify(mergedEntry.metadata)}` : "";

    return `${timestamp} ${level} ${name} ${mergedEntry.message}${meta}`;
  }

  /**
   * Rotate a log file if it exceeds maxFileSize
   * Renames file.log -> file.log.1, file.log.1 -> file.log.2, etc.
   */
  private rotateIfNeeded(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const stats = fs.statSync(filePath);
    if (stats.size < this.config.maxFileSize) {
      return;
    }

    // Rotate existing numbered files
    for (let i = this.config.maxFiles - 1; i >= 1; i--) {
      const oldPath = `${filePath}.${i}`;
      const newPath = `${filePath}.${i + 1}`;

      if (fs.existsSync(oldPath)) {
        if (i === this.config.maxFiles - 1) {
          // Delete the oldest file
          fs.unlinkSync(oldPath);
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    // Rename current file to .1
    fs.renameSync(filePath, `${filePath}.1`);
  }

  /**
   * Write a line to a log file
   */
  private writeToFile(filePath: string, line: string): void {
    this.rotateIfNeeded(filePath);
    fs.appendFileSync(filePath, `${line}\n`, "utf8");
  }

  /**
   * Write a log entry to disk
   */
  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Lazy initialization if not already done
    if (!this.initialized) {
      this.ensureDirectoryExists();
      this.initialized = true;
    }

    const line = this.formatEntry(entry);

    // Write to combined log
    const combinedPath = this.getFilePath(this.config.combinedFilename);
    this.writeToFile(combinedPath, line);

    // Also write errors to error log
    if (entry.level === LOG_LEVEL.ERROR) {
      const errorPath = this.getFilePath(this.config.errorFilename);
      this.writeToFile(errorPath, line);
    }
  }

  /**
   * Create a child logger with inherited configuration
   */
  child(name: string, defaultMetadata?: LogMetadata): LoggerAdapter {
    const childAdapter = new FileLoggerAdapter({
      directory: this.config.directory,
      combinedFilename: this.config.combinedFilename,
      errorFilename: this.config.errorFilename,
      maxFileSize: this.config.maxFileSize,
      maxFiles: this.config.maxFiles,
      format: this.config.format,
    });

    childAdapter.name = name;
    childAdapter.minLevel = this.minLevel;
    childAdapter.defaultMetadata = {
      ...this.defaultMetadata,
      ...defaultMetadata,
    };
    childAdapter.initialized = this.initialized;

    return childAdapter;
  }

  /**
   * Flush any buffered writes (sync writes, so no-op)
   */
  async flush(): Promise<void> {
    // Synchronous writes, nothing to flush
  }

  /**
   * Clean up resources (no-op for file adapter)
   */
  async destroy(): Promise<void> {
    // No resources to clean up
  }
}

/**
 * Create a pre-configured FileLoggerAdapter
 *
 * @param config - File logger configuration
 * @returns Configured FileLoggerAdapter
 */
export function createFileAdapter(config?: FileLoggerConfig): FileLoggerAdapter {
  return new FileLoggerAdapter(config);
}
