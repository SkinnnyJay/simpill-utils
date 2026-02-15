/**
 * @file Environment Configuration
 * @description Load logger configuration from environment variables
 */

import type { LoggerAdapterConfig } from "./adapter";
import {
  BOOLEAN_FALSY_VALUES,
  BOOLEAN_TRUTHY_VALUES,
  ENV_KEYS,
  LOG_FORMAT_VALUES,
  LOG_LEVEL,
  type LogFormatValue,
  type LogLevel,
} from "./constants";
import {
  ColoredFormatterAdapter,
  type FormatterAdapter,
  SimpleFormatterAdapter,
} from "./formatters";

/**
 * Environment configuration result
 */
export interface EnvLoggerConfig {
  /** Minimum log level */
  minLevel: LogLevel;
  /** Output format */
  format: LogFormatValue;
  /** Include timestamps */
  includeTimestamp: boolean;
  /** Enable colored output */
  enableColors: boolean;
}

/**
 * Default configuration values
 */
export const ENV_DEFAULTS: EnvLoggerConfig = {
  minLevel: LOG_LEVEL.DEBUG,
  format: LOG_FORMAT_VALUES.PRETTY,
  includeTimestamp: true,
  enableColors: true,
};

/**
 * Parse a boolean from environment variable string (strict, from @simpill/protocols.utils)
 * Accepts: "true", "1" as truthy; "false", "0" as falsy
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();

  if (BOOLEAN_TRUTHY_VALUES.includes(normalized as (typeof BOOLEAN_TRUTHY_VALUES)[number])) {
    return true;
  }

  if (BOOLEAN_FALSY_VALUES.includes(normalized as (typeof BOOLEAN_FALSY_VALUES)[number])) {
    return false;
  }

  return defaultValue;
}

/**
 * Parse log level from environment variable
 * Accepts uppercase or lowercase: DEBUG, debug, INFO, info, etc.
 */
function parseLogLevel(value: string | undefined, defaultValue: LogLevel): LogLevel {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const normalized = value.toUpperCase().trim();

  if (normalized in LOG_LEVEL) {
    return normalized as LogLevel;
  }

  return defaultValue;
}

/**
 * Parse log format from environment variable
 * Accepts: json, pretty (case-insensitive)
 */
function parseLogFormat(value: string | undefined, defaultValue: LogFormatValue): LogFormatValue {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const normalized = value.toLowerCase().trim();

  if (normalized === LOG_FORMAT_VALUES.JSON) {
    return LOG_FORMAT_VALUES.JSON;
  }

  if (normalized === LOG_FORMAT_VALUES.PRETTY) {
    return LOG_FORMAT_VALUES.PRETTY;
  }

  return defaultValue;
}

/**
 * Get environment variable value safely
 * Works in Node.js and edge runtimes
 */
function getEnvVar(key: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[key];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Load logger configuration from environment variables
 *
 * Environment variables:
 * - LOG_LEVEL: Minimum log level (DEBUG, INFO, WARN, ERROR)
 * - LOG_FORMAT: Output format (json, pretty)
 * - LOG_TIMESTAMPS: Include timestamps (true, false)
 * - LOG_COLORS: Enable colored output for pretty format (true, false)
 *
 * @returns Parsed configuration from environment
 *
 * @example
 * ```typescript
 * // With environment: LOG_LEVEL=INFO, LOG_FORMAT=json
 * const config = loadEnvConfig();
 * // { minLevel: "INFO", format: "json", includeTimestamp: true, enableColors: true }
 * ```
 */
export function loadEnvConfig(): EnvLoggerConfig {
  return {
    minLevel: parseLogLevel(getEnvVar(ENV_KEYS.LOG_LEVEL), ENV_DEFAULTS.minLevel),
    format: parseLogFormat(getEnvVar(ENV_KEYS.LOG_FORMAT), ENV_DEFAULTS.format),
    includeTimestamp: parseEnvBoolean(
      getEnvVar(ENV_KEYS.LOG_TIMESTAMPS),
      ENV_DEFAULTS.includeTimestamp
    ),
    enableColors: parseEnvBoolean(getEnvVar(ENV_KEYS.LOG_COLORS), ENV_DEFAULTS.enableColors),
  };
}

/**
 * Create a formatter based on environment configuration
 */
export function createFormatterFromEnv(config: EnvLoggerConfig): FormatterAdapter {
  if (config.format === LOG_FORMAT_VALUES.JSON) {
    return new SimpleFormatterAdapter({
      jsonOutput: true,
      includeTimestamp: config.includeTimestamp,
    });
  }

  // Pretty format
  if (config.enableColors) {
    return new ColoredFormatterAdapter({
      includeTimestamp: config.includeTimestamp,
    });
  }

  return new SimpleFormatterAdapter({
    jsonOutput: false,
    includeTimestamp: config.includeTimestamp,
  });
}

/**
 * Convert environment config to LoggerAdapterConfig
 */
export function envConfigToAdapterConfig(envConfig: EnvLoggerConfig): LoggerAdapterConfig {
  return {
    minLevel: envConfig.minLevel,
    includeTimestamp: envConfig.includeTimestamp,
    prettyPrint: envConfig.format === LOG_FORMAT_VALUES.PRETTY,
    formatter: createFormatterFromEnv(envConfig),
  };
}

/** Load adapter config from env (loadEnvConfig + envConfigToAdapterConfig). Use with configureLoggerFactory({ config: loadAdapterConfigFromEnv() }). */
export function loadAdapterConfigFromEnv(): LoggerAdapterConfig {
  return envConfigToAdapterConfig(loadEnvConfig());
}

/** True if any logger env vars are set (for auto-config). */
export function hasEnvConfig(): boolean {
  return (
    getEnvVar(ENV_KEYS.LOG_LEVEL) !== undefined ||
    getEnvVar(ENV_KEYS.LOG_FORMAT) !== undefined ||
    getEnvVar(ENV_KEYS.LOG_TIMESTAMPS) !== undefined ||
    getEnvVar(ENV_KEYS.LOG_COLORS) !== undefined
  );
}
