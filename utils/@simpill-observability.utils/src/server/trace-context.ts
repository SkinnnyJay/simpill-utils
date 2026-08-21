import { randomBytes } from "node:crypto";

/**
 * W3C Trace Context (traceparent / tracestate) utilities.
 *
 * Implements the parsing, validation, formatting, and generation rules of the
 * W3C Trace Context Recommendation (including the Level 2 random-trace-id
 * flag), so callers can bridge inbound HTTP trace headers into
 * `runWithRequestContext` / the logger without pulling in an OTel SDK.
 *
 * Spec highlights implemented here:
 * - `version-format = trace-id "-" parent-id "-" trace-flags`, all lowercase hex.
 * - Non-lowercase hex anywhere => the entire header MUST be ignored.
 * - All-zero trace-id or parent-id => invalid.
 * - Version `ff` => invalid. Version `00` must be exactly 55 characters.
 * - Versions above `00` are parsed with the `00` layout (forward compatibility);
 *   trailing data is allowed only when preceded by a `-` delimiter.
 * - Only known trace-flags bits are interpreted; unknown bits are zeroed on output.
 */

/** Sampled flag (least significant bit of trace-flags). */
export const TRACE_FLAG_SAMPLED = 0x01;
/** Random-trace-id flag (second least significant bit; W3C Trace Context Level 2). */
export const TRACE_FLAG_RANDOM_TRACE_ID = 0x02;

const KNOWN_TRACE_FLAGS = TRACE_FLAG_SAMPLED | TRACE_FLAG_RANDOM_TRACE_ID;

const VERSION_LENGTH = 2;
const TRACE_ID_LENGTH = 32;
const PARENT_ID_LENGTH = 16;
const FLAGS_LENGTH = 2;
/** Length of a version-00 traceparent: 2 + 1 + 32 + 1 + 16 + 1 + 2. */
const TRACEPARENT_LENGTH = 55;

const TRACE_ID_OFFSET = VERSION_LENGTH + 1;
const PARENT_ID_OFFSET = TRACE_ID_OFFSET + TRACE_ID_LENGTH + 1;
const FLAGS_OFFSET = PARENT_ID_OFFSET + PARENT_ID_LENGTH + 1;

const CHAR_DASH = 0x2d;
const CHAR_ZERO = 0x30;
const CHAR_NINE = 0x39;
const CHAR_A = 0x61;
const CHAR_F = 0x66;
const CHAR_SPACE = 0x20;
const CHAR_TAB = 0x09;

/** A parsed, validated traceparent header. */
export interface ParsedTraceparent {
  /** Version byte (0–254; 255/"ff" is rejected as invalid). */
  version: number;
  /** 32 lowercase hex chars; never all zeros. */
  traceId: string;
  /** 16 lowercase hex chars (the caller's span id); never all zeros. */
  parentId: string;
  /** Raw trace-flags byte as received (0–255). */
  traceFlags: number;
  /** True when the sampled bit (0x01) is set. */
  sampled: boolean;
  /** True when the Level 2 random-trace-id bit (0x02) is set. */
  randomTraceId: boolean;
}

/** Input accepted by {@link formatTraceparent}. */
export interface TraceparentInput {
  traceId: string;
  /** The span id of the current operation (called parent-id on the wire). */
  parentId: string;
  sampled?: boolean;
  /** Defaults to true for ids produced by {@link generateTraceId}. */
  randomTraceId?: boolean;
  /** Raw flags byte; when provided, unknown bits are zeroed per spec. */
  traceFlags?: number;
}

function isLowercaseHex(value: string, start: number, end: number): boolean {
  for (let i = start; i < end; i++) {
    const c = value.charCodeAt(i);
    const isDigit = c >= CHAR_ZERO && c <= CHAR_NINE;
    const isLowerAF = c >= CHAR_A && c <= CHAR_F;
    if (!isDigit && !isLowerAF) return false;
  }
  return true;
}

function isAllZeros(value: string, start: number, end: number): boolean {
  for (let i = start; i < end; i++) {
    if (value.charCodeAt(i) !== CHAR_ZERO) return false;
  }
  return true;
}

function trimOws(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const c = value.charCodeAt(start);
    if (c !== CHAR_SPACE && c !== CHAR_TAB) break;
    start++;
  }
  while (end > start) {
    const c = value.charCodeAt(end - 1);
    if (c !== CHAR_SPACE && c !== CHAR_TAB) break;
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}

/** True when `value` is a valid W3C trace-id (32 lowercase hex chars, not all zeros). */
export function isValidTraceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === TRACE_ID_LENGTH &&
    isLowercaseHex(value, 0, TRACE_ID_LENGTH) &&
    !isAllZeros(value, 0, TRACE_ID_LENGTH)
  );
}

/** True when `value` is a valid W3C span-id / parent-id (16 lowercase hex chars, not all zeros). */
export function isValidSpanId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === PARENT_ID_LENGTH &&
    isLowercaseHex(value, 0, PARENT_ID_LENGTH) &&
    !isAllZeros(value, 0, PARENT_ID_LENGTH)
  );
}

/**
 * Parse and validate a traceparent header value per the W3C Trace Context spec.
 *
 * Returns `null` for any invalid header — per the spec's processing model the
 * caller should then start a new trace (and MUST NOT use the accompanying
 * tracestate). Accepts `string[]` for convenience with Node header shapes; a
 * request carrying more than one traceparent value is treated as invalid
 * (traceparent is a single-valued header).
 */
export function parseTraceparent(
  header: string | readonly string[] | undefined | null
): ParsedTraceparent | null {
  let raw: string;
  if (typeof header === "string") {
    raw = header;
  } else if (Array.isArray(header) && header.length === 1 && typeof header[0] === "string") {
    raw = header[0];
  } else {
    return null;
  }

  const value = trimOws(raw);
  const len = value.length;
  if (len < TRACEPARENT_LENGTH) return null;

  // Version: 2 lowercase hex chars; "ff" is forbidden.
  if (!isLowercaseHex(value, 0, VERSION_LENGTH)) return null;
  const version = Number.parseInt(value.slice(0, VERSION_LENGTH), 16);
  if (version === 0xff) return null;

  // Version 00 must be exactly 55 chars; higher versions may carry trailing
  // fields, but only behind a "-" delimiter after the version-00 layout.
  if (version === 0) {
    if (len !== TRACEPARENT_LENGTH) return null;
  } else if (len > TRACEPARENT_LENGTH && value.charCodeAt(TRACEPARENT_LENGTH) !== CHAR_DASH) {
    return null;
  }

  // Delimiters.
  if (
    value.charCodeAt(TRACE_ID_OFFSET - 1) !== CHAR_DASH ||
    value.charCodeAt(PARENT_ID_OFFSET - 1) !== CHAR_DASH ||
    value.charCodeAt(FLAGS_OFFSET - 1) !== CHAR_DASH
  ) {
    return null;
  }

  // trace-id: 32 lowercase hex, not all zeros.
  const traceIdEnd = TRACE_ID_OFFSET + TRACE_ID_LENGTH;
  if (
    !isLowercaseHex(value, TRACE_ID_OFFSET, traceIdEnd) ||
    isAllZeros(value, TRACE_ID_OFFSET, traceIdEnd)
  ) {
    return null;
  }

  // parent-id: 16 lowercase hex, not all zeros.
  const parentIdEnd = PARENT_ID_OFFSET + PARENT_ID_LENGTH;
  if (
    !isLowercaseHex(value, PARENT_ID_OFFSET, parentIdEnd) ||
    isAllZeros(value, PARENT_ID_OFFSET, parentIdEnd)
  ) {
    return null;
  }

  // trace-flags: 2 lowercase hex chars.
  const flagsEnd = FLAGS_OFFSET + FLAGS_LENGTH;
  if (!isLowercaseHex(value, FLAGS_OFFSET, flagsEnd)) return null;
  const traceFlags = Number.parseInt(value.slice(FLAGS_OFFSET, flagsEnd), 16);

  return {
    version,
    traceId: value.slice(TRACE_ID_OFFSET, traceIdEnd),
    parentId: value.slice(PARENT_ID_OFFSET, parentIdEnd),
    traceFlags,
    sampled: (traceFlags & TRACE_FLAG_SAMPLED) !== 0,
    randomTraceId: (traceFlags & TRACE_FLAG_RANDOM_TRACE_ID) !== 0,
  };
}

const HEX_BYTE: string[] = [];
for (let i = 0; i < 256; i++) {
  HEX_BYTE.push(i.toString(16).padStart(2, "0"));
}

/**
 * Serialize a version-00 traceparent header.
 *
 * Unknown trace-flags bits are zeroed on output, per the spec's requirement
 * that vendors set unparsed flags to 0 on outgoing requests. Throws
 * `TypeError` on an invalid traceId/parentId rather than emitting a header
 * that downstream parsers would silently discard.
 */
export function formatTraceparent(input: TraceparentInput): string {
  if (!isValidTraceId(input.traceId)) {
    throw new TypeError(
      "formatTraceparent: traceId must be 32 lowercase hex characters and not all zeros"
    );
  }
  if (!isValidSpanId(input.parentId)) {
    throw new TypeError(
      "formatTraceparent: parentId must be 16 lowercase hex characters and not all zeros"
    );
  }

  let flags: number;
  if (typeof input.traceFlags === "number") {
    flags = input.traceFlags & KNOWN_TRACE_FLAGS;
  } else {
    flags = 0;
    if (input.sampled) flags |= TRACE_FLAG_SAMPLED;
    if (input.randomTraceId) flags |= TRACE_FLAG_RANDOM_TRACE_ID;
  }

  return `00-${input.traceId}-${input.parentId}-${HEX_BYTE[flags]}`;
}

function randomHexNonZero(byteLength: number): string {
  // Regenerating on an all-zero draw keeps the all-zeros-forbidden invariant
  // without biasing any other value (P(all zero) = 2^-64 or 2^-128).
  for (;;) {
    const bytes = randomBytes(byteLength);
    let nonZero = false;
    let out = "";
    for (let i = 0; i < byteLength; i++) {
      const b = bytes[i] as number;
      if (b !== 0) nonZero = true;
      out += HEX_BYTE[b];
    }
    if (nonZero) return out;
  }
}

/**
 * Generate a spec-valid random trace-id (16 CSPRNG bytes, lowercase hex, never
 * all zeros). Fully random, so the Level 2 random-trace-id flag can be set.
 */
export function generateTraceId(): string {
  return randomHexNonZero(16);
}

/** Generate a spec-valid random span-id (8 CSPRNG bytes, lowercase hex, never all zeros). */
export function generateSpanId(): string {
  return randomHexNonZero(8);
}

/**
 * Request-context-shaped trace fields extracted (or started) from headers.
 * Shape is compatible with `RequestContext` from @simpill/request-context.utils
 * and `LogContext` from @simpill/logger.utils.
 */
export interface HeaderTraceContext {
  traceId: string;
  /** Span id of the upstream caller when continuing a trace; a fresh id when starting one. */
  spanId: string;
  sampled: boolean;
  /** Raw flags byte for propagation decisions. */
  traceFlags: number;
  /** True when this call started a new trace (no valid inbound traceparent). */
  isNewTrace: boolean;
  /**
   * Inbound tracestate to propagate unmodified, only present when the inbound
   * traceparent was valid (spec: tracestate MUST be discarded otherwise).
   */
  tracestate?: string;
}

/** Options for {@link traceContextFromHeaders}. */
export interface TraceContextFromHeadersOptions {
  /**
   * When there is no valid inbound traceparent: start a new trace (default,
   * mirroring the spec's "create a new traceparent" processing model) or
   * return null.
   */
  generateIfMissing?: boolean;
}

function readHeader(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string
): string | string[] | undefined {
  if (!headers) return undefined;
  const direct = headers[name];
  if (direct !== undefined) return direct;
  // Header names are ASCII case-insensitive; Node lowercases them, but plain
  // objects from other sources may not.
  for (const key of Object.keys(headers)) {
    if (key.length === name.length && key.toLowerCase() === name) {
      return headers[key];
    }
  }
  return undefined;
}

/**
 * Extract W3C trace context from an inbound header map, ready to hand to
 * `runWithRequestContext` (and therefore to the logger via
 * `setupObservability`).
 *
 * Follows the spec's processing model: a valid inbound traceparent is
 * continued (same traceId, inbound tracestate preserved); an invalid or
 * missing one starts a new trace and discards tracestate.
 */
export function traceContextFromHeaders(
  headers: Record<string, string | string[] | undefined> | undefined,
  options?: TraceContextFromHeadersOptions
): HeaderTraceContext | null {
  const parsed = parseTraceparent(readHeader(headers, "traceparent") as string | string[] | null);

  if (parsed) {
    const context: HeaderTraceContext = {
      traceId: parsed.traceId,
      spanId: parsed.parentId,
      sampled: parsed.sampled,
      traceFlags: parsed.traceFlags & KNOWN_TRACE_FLAGS,
      isNewTrace: false,
    };
    const tracestate = readHeader(headers, "tracestate");
    if (typeof tracestate === "string" && tracestate.length > 0) {
      context.tracestate = tracestate;
    } else if (Array.isArray(tracestate) && tracestate.length > 0) {
      // tracestate is a comma-separated list header; multiple fields combine per RFC 9110.
      context.tracestate = tracestate.join(",");
    }
    return context;
  }

  if (options?.generateIfMissing === false) return null;

  return {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    sampled: false,
    traceFlags: TRACE_FLAG_RANDOM_TRACE_ID,
    isNewTrace: true,
  };
}
