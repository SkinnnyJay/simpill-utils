/**
 * Environment variable keys and values for logger configuration.
 * Shared so logger and other packages stay aligned.
 */
export const LOG_ENV_KEYS = {
  HOSTNAME: "HOSTNAME",
  LOG_LEVEL: "LOG_LEVEL",
  LOG_FORMAT: "LOG_FORMAT",
  LOG_TIMESTAMPS: "LOG_TIMESTAMPS",
  LOG_COLORS: "LOG_COLORS",
} as const;

export type LogEnvKey = (typeof LOG_ENV_KEYS)[keyof typeof LOG_ENV_KEYS];

export const LOG_FORMAT_VALUES = {
  JSON: "json",
  PRETTY: "pretty",
} as const;

export type LogFormatValue = (typeof LOG_FORMAT_VALUES)[keyof typeof LOG_FORMAT_VALUES];
