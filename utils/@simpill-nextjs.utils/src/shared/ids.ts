/**
 * Edge-safe ID + correlation utilities shared by client and server.
 * Pure Web APIs only — no Node imports — so middleware (Edge runtime) can use them.
 */

/**
 * Shape a correlation id must match before it is trusted from an incoming header.
 * Unvalidated reflection of `x-request-id` lets a client push arbitrarily large or
 * log-injecting values into responses, request context, and log lines. This pattern
 * (URL-safe charset, 1-128 chars) follows the Envoy convention for external request ids.
 */
export const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._~-]{1,128}$/;

/** True when `value` is a string matching CORRELATION_ID_PATTERN. */
export function isValidCorrelationId(value: unknown): value is string {
  return typeof value === "string" && CORRELATION_ID_PATTERN.test(value);
}

const HEX = "0123456789abcdef";

function randomHex(byteLength: number): string | null {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint8Array(byteLength);
    crypto.getRandomValues(buf);
    let out = "";
    for (const byte of buf) {
      out += HEX[byte >> 4];
      out += HEX[byte & 0x0f];
    }
    return out;
  }
  return null;
}

/**
 * Generates a request id: crypto.randomUUID when available, then a CSPRNG hex id,
 * and only as a last resort the legacy time+Math.random fallback.
 */
export function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = randomHex(16);
  if (hex !== null) {
    return hex;
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Parsed W3C Trace Context `traceparent` header. */
export interface ParsedTraceparent {
  version: string;
  traceId: string;
  parentId: string;
  flags: string;
}

const TRACEPARENT_V00 = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
const ZERO_TRACE_ID = "00000000000000000000000000000000";
const ZERO_PARENT_ID = "0000000000000000";
const TRACEPARENT_V00_LENGTH = 55;

/**
 * Strict W3C Trace Context parser (https://www.w3.org/TR/trace-context/):
 * lowercase hex only, all-zero trace-id/parent-id rejected, version 0xff rejected.
 * Future versions are tolerated per spec: parse the version-00 prefix when the
 * remainder starts with an additional `-` member.
 */
export function parseTraceparent(value: unknown): ParsedTraceparent | null {
  if (typeof value !== "string") {
    return null;
  }
  let candidate = value;
  if (candidate.length > TRACEPARENT_V00_LENGTH) {
    // Future version: accept iff the extra content is a `-`-delimited suffix
    // and the declared version is not 00 (version 00 must be exactly 55 chars).
    if (candidate[TRACEPARENT_V00_LENGTH] !== "-" || candidate.startsWith("00-")) {
      return null;
    }
    candidate = candidate.slice(0, TRACEPARENT_V00_LENGTH);
  }
  const match = TRACEPARENT_V00.exec(candidate);
  if (match === null) {
    return null;
  }
  const [, version, traceId, parentId, flags] = match;
  if (version === "ff" || traceId === ZERO_TRACE_ID || parentId === ZERO_PARENT_ID) {
    return null;
  }
  return { version, traceId, parentId, flags };
}

/** Generates a non-zero 16-byte (32 hex char) W3C trace id. */
export function generateTraceId(): string {
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = randomHex(16);
    if (id === null) {
      break;
    }
    if (id !== ZERO_TRACE_ID) {
      return id;
    }
  }
  return `${Date.now().toString(16).padStart(16, "0")}${Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, "0")}${Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, "0")}`.slice(0, 32);
}

/** Generates a non-zero 8-byte (16 hex char) W3C parent/span id. */
export function generateSpanId(): string {
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = randomHex(8);
    if (id === null) {
      break;
    }
    if (id !== ZERO_PARENT_ID) {
      return id;
    }
  }
  return Date.now().toString(16).padStart(16, "0").slice(0, 16);
}

/** Formats a version-00 traceparent header value. Throws on invalid members. */
export function formatTraceparent(traceId: string, parentId: string, flags = "01"): string {
  const value = `00-${traceId}-${parentId}-${flags}`;
  if (parseTraceparent(value) === null) {
    throw new TypeError(`Invalid traceparent members: ${value}`);
  }
  return value;
}
