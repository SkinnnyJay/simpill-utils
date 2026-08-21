import { AppError } from "./app-error";

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

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  CONFLICT: "Conflict",
  INTERNAL: "Internal error",
  TIMEOUT: "Request timeout",
  VALIDATION: "Validation failed",
};

/**
 * Creates an error message map for code -> default message.
 * Use with createErrorFromCode for consistent messages.
 */
export function createErrorCodeMap(
  map: Partial<Record<ErrorCode, string>>
): Record<ErrorCode, string> {
  return { ...DEFAULT_MESSAGES, ...map };
}

/**
 * Create an AppError from a typed error code with a consistent default message.
 * Pass `message` to override, or `messages` (from createErrorCodeMap) for a custom map.
 */
export function createErrorFromCode(
  code: ErrorCode,
  options?: ErrorCodeOptions & { message?: string; messages?: Record<ErrorCode, string> }
): AppError {
  const message = options?.message ?? options?.messages?.[code] ?? DEFAULT_MESSAGES[code];
  return new AppError(message, { code, meta: options?.meta, cause: options?.cause });
}

/**
 * HTTP status for each error code.
 * VALIDATION -> 422 (syntactically valid, semantically invalid) vs BAD_REQUEST -> 400 (malformed),
 * per common RFC 9457 usage. TIMEOUT -> 504 (upstream/operation timeout surfaced by the server).
 */
export const HTTP_STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
  TIMEOUT: 504,
  VALIDATION: 422,
};

/** Map an error code (or any string code) to an HTTP status; unknown codes fall back (default 500). */
export function httpStatusFromCode(code: string, fallback = 500): number {
  return HTTP_STATUS_BY_CODE[code as ErrorCode] ?? fallback;
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "TIMEOUT",
  409: "CONFLICT",
  422: "VALIDATION",
  500: "INTERNAL",
  504: "TIMEOUT",
};

/** Map an HTTP status to the closest error code (unmapped 4xx -> BAD_REQUEST, 5xx/other -> INTERNAL). */
export function errorCodeFromStatus(status: number): ErrorCode {
  const exact = CODE_BY_STATUS[status];
  if (exact) return exact;
  if (status >= 400 && status < 500) return "BAD_REQUEST";
  return "INTERNAL";
}
