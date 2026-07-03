/**
 * HTTP method type and constants.
 * Single source of truth for API and HTTP client packages.
 *
 * `HTTP_METHOD` covers the application-level methods (the ones an API
 * factory or HTTP client legitimately dispatches). The full IANA HTTP
 * Method Registry — including proxy/diagnostic methods — lives in
 * `HTTP_METHOD_PROPERTIES` with each method's `safe` / `idempotent`
 * columns exactly as registered (RFC 9110 §9.2.1–9.2.2, RFC 5789,
 * RFC 10008).
 */
export const HTTP_METHOD = {
  GET: "GET",
  HEAD: "HEAD",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  /** RFC 10008 (June 2026): safe, idempotent, cacheable request with a body. */
  QUERY: "QUERY",
} as const;
Object.freeze(HTTP_METHOD);

export type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

/**
 * IANA HTTP Method Registry `safe` / `idempotent` columns.
 * Sources: RFC 9110 §16.3.1 table (GET/HEAD/POST/PUT/DELETE/CONNECT/OPTIONS/TRACE),
 * RFC 5789 (PATCH: not safe, not idempotent),
 * RFC 10008 §5.1 (QUERY: safe, idempotent).
 */
export const HTTP_METHOD_PROPERTIES = {
  CONNECT: { safe: false, idempotent: false },
  DELETE: { safe: false, idempotent: true },
  GET: { safe: true, idempotent: true },
  HEAD: { safe: true, idempotent: true },
  OPTIONS: { safe: true, idempotent: true },
  PATCH: { safe: false, idempotent: false },
  POST: { safe: false, idempotent: false },
  PUT: { safe: false, idempotent: true },
  QUERY: { safe: true, idempotent: true },
  TRACE: { safe: true, idempotent: true },
} as const;
for (const props of Object.values(HTTP_METHOD_PROPERTIES)) {
  Object.freeze(props);
}
Object.freeze(HTTP_METHOD_PROPERTIES);

/** Every IANA-registered HTTP method, including proxy/diagnostic methods. */
export type AnyHttpMethod = keyof typeof HTTP_METHOD_PROPERTIES;

/** Methods defined as safe (read-only semantics) — RFC 9110 §9.2.1, RFC 10008. */
export const SAFE_HTTP_METHODS = ["GET", "HEAD", "OPTIONS", "QUERY", "TRACE"] as const;
Object.freeze(SAFE_HTTP_METHODS);

export type SafeHttpMethod = (typeof SAFE_HTTP_METHODS)[number];

/**
 * Methods defined as idempotent (retry-safe) — RFC 9110 §9.2.2, RFC 10008.
 * The canonical default for HTTP client retry policies.
 */
export const IDEMPOTENT_HTTP_METHODS = [
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PUT",
  "QUERY",
  "TRACE",
] as const;
Object.freeze(IDEMPOTENT_HTTP_METHODS);

export type IdempotentHttpMethod = (typeof IDEMPOTENT_HTTP_METHODS)[number];
