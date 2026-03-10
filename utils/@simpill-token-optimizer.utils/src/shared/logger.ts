export type LogMeta = Record<string, unknown>;

export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}

const formatArgs = (message: string, meta?: LogMeta): [string, LogMeta?] =>
  meta ? [message, meta] : [message];

export const createScopedLogger = (scope: string): Logger => {
  const prefix = `[${scope}]`;

  return {
    debug: (message, meta) => {
      console.debug(prefix, ...formatArgs(message, meta));
    },
    warn: (message, meta) => {
      console.warn(prefix, ...formatArgs(message, meta));
    },
    error: (message, meta) => {
      console.error(prefix, ...formatArgs(message, meta));
    },
  };
};
