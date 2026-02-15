/**
 * Typed error code constants and factory for consistent error creation.
 */
export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL: "INTERNAL",
  TIMEOUT: "TIMEOUT",
  VALIDATION: "VALIDATION",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorCodeOptions {
  meta?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * Creates an error message map for code -> default message.
 * Use with createErrorFromCode for consistent messages.
 */
export function createErrorCodeMap(
  map: Partial<Record<ErrorCode, string>>
): Record<ErrorCode, string> {
  const defaults: Record<ErrorCode, string> = {
    BAD_REQUEST: "Bad request",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
    NOT_FOUND: "Not found",
    CONFLICT: "Conflict",
    INTERNAL: "Internal error",
    TIMEOUT: "Request timeout",
    VALIDATION: "Validation failed",
  };
  return { ...defaults, ...map };
}
