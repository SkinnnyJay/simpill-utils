import { ERROR_HTTP_RESPONSE_PREFIX, ERROR_HTTP_RESPONSE_SEP } from "./internal-constants";

/**
 * Typed error for non-2xx HTTP responses from the API client.
 * Message stays byte-compatible with v1 ("HTTP <status>: <body>") so existing
 * string matching keeps working, while status/body/url/method become
 * programmatically accessible (no more regexing the message).
 */
export class ApiHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  /** Raw response body text (already consumed). */
  readonly body: string;
  readonly url: string;
  readonly method: string;
  readonly routeKey?: string;

  constructor(info: {
    status: number;
    statusText: string;
    body: string;
    url: string;
    method: string;
    routeKey?: string;
  }) {
    super(ERROR_HTTP_RESPONSE_PREFIX + info.status + ERROR_HTTP_RESPONSE_SEP + info.body);
    this.name = "ApiHttpError";
    this.status = info.status;
    this.statusText = info.statusText;
    this.body = info.body;
    this.url = info.url;
    this.method = info.method;
    this.routeKey = info.routeKey;
    Error.captureStackTrace?.(this, ApiHttpError);
  }
}

/**
 * Timeout error raised by fetchWithTimeout (and the client's timeoutMs option).
 * name is "TimeoutError" to match the platform convention set by
 * AbortSignal.timeout(), so `err.name === "TimeoutError"` distinguishes a
 * timeout from a user abort (`"AbortError"`).
 */
export class ApiTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
    Error.captureStackTrace?.(this, ApiTimeoutError);
  }
}

/**
 * Thrown by the client when a path template references a param that was not
 * provided. v1 silently sent the literal ":id" segment to the server.
 */
export class ApiMissingParamError extends Error {
  readonly param: string;
  readonly path: string;

  constructor(param: string, path: string) {
    super(`Missing path param ":${param}" for route path "${path}"`);
    this.name = "ApiMissingParamError";
    this.param = param;
    this.path = path;
    Error.captureStackTrace?.(this, ApiMissingParamError);
  }
}

/**
 * Thrown by the client when a 2xx response has a NON-EMPTY body that is not
 * valid JSON. v1 silently coerced any invalid JSON to `{}` (data corruption).
 * Empty bodies still parse to `{}` for backward compatibility (204s etc.).
 */
export class ApiResponseParseError extends Error {
  readonly url: string;
  readonly method: string;
  readonly routeKey?: string;
  /** First 256 chars of the offending body. */
  readonly bodySnippet: string;

  constructor(info: {
    url: string;
    method: string;
    routeKey?: string;
    body: string;
    cause?: unknown;
  }) {
    super(`Invalid JSON in response body from ${info.method} ${info.url}`);
    this.name = "ApiResponseParseError";
    this.url = info.url;
    this.method = info.method;
    this.routeKey = info.routeKey;
    this.bodySnippet = info.body.slice(0, 256);
    if (info.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        value: info.cause,
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }
    Error.captureStackTrace?.(this, ApiResponseParseError);
  }
}

/**
 * Thrown when two routes are registered under the same key. v1 silently let
 * the later route overwrite the earlier one in both client() and handlers().
 */
export class ApiDuplicateRouteError extends Error {
  readonly routeKey: string;

  constructor(routeKey: string) {
    super(
      `Duplicate route key "${routeKey}". Route keys default to "METHOD:path"; pass a unique name via route(path, name).`
    );
    this.name = "ApiDuplicateRouteError";
    this.routeKey = routeKey;
    Error.captureStackTrace?.(this, ApiDuplicateRouteError);
  }
}
