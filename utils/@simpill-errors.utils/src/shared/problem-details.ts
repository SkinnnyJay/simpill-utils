import { errorCodeFromStatus, httpStatusFromCode } from "./error-codes";
import { sanitizeForJson, serializeError } from "./serialize-error";

/** Content-Type for RFC 9457 problem detail responses. */
export const PROBLEM_JSON_CONTENT_TYPE = "application/problem+json";

/**
 * RFC 9457 "Problem Details for HTTP APIs" object (successor to RFC 7807).
 * `code` and `meta` are extension members (permitted by the RFC; unknown members are ignored by clients).
 */
export interface ProblemDetails {
  /** URI reference identifying the problem type; defaults to "about:blank" per the RFC. */
  type: string;
  /** Short, human-readable summary of the problem type. */
  title: string;
  /** HTTP status code for this occurrence (advisory; MUST match the actual response status). */
  status: number;
  /** Human-readable explanation specific to this occurrence. */
  detail?: string;
  /** URI reference identifying this specific occurrence (e.g. request path or trace URI). */
  instance?: string;
  /** Extension: application error code (e.g. ERROR_CODES value). */
  code?: string;
  /** Extension: sanitized, JSON-safe metadata. */
  meta?: Record<string, unknown>;
}

const REASON_PHRASES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  408: "Request Timeout",
  409: "Conflict",
  422: "Unprocessable Content",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

/**
 * Convert any thrown value to an RFC 9457 problem details object.
 * Status is derived from the error's `code` via HTTP_STATUS_BY_CODE unless overridden.
 * Stack traces and causes are NEVER included (RFC 9457 security guidance: problem details
 * describe the HTTP interface, not the implementation). Meta is sanitized to be JSON-safe
 * and only included when `includeMeta` is set (it may contain internal identifiers).
 */
export function toProblemDetails(
  error: unknown,
  options?: {
    status?: number;
    type?: string;
    title?: string;
    instance?: string;
    includeMeta?: boolean;
  }
): ProblemDetails {
  const serialized = serializeError(error);
  const status = options?.status ?? (serialized.code ? httpStatusFromCode(serialized.code) : 500);
  const problem: ProblemDetails = {
    type: options?.type ?? "about:blank",
    title: options?.title ?? REASON_PHRASES[status] ?? "Error",
    status,
  };
  if (serialized.message && serialized.message !== "Unknown error")
    problem.detail = serialized.message;
  if (options?.instance) problem.instance = options.instance;
  problem.code = serialized.code ?? errorCodeFromStatus(status);
  if (options?.includeMeta && serialized.meta && Object.keys(serialized.meta).length > 0) {
    problem.meta = sanitizeForJson(serialized.meta) as Record<string, unknown>;
  }
  return problem;
}
