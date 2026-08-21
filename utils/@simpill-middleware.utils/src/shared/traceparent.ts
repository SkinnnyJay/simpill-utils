import { VALUE_1 } from "./constants";

/** Parsed W3C Trace Context `traceparent` header (version 00 format). */
export interface TraceparentData {
  version: string;
  /** 32 lowercase hex chars; never all zeros. */
  traceId: string;
  /** 16 lowercase hex chars (a.k.a. span id of the caller); never all zeros. */
  parentId: string;
  /** 2 lowercase hex chars. */
  traceFlags: string;
  /** Least-significant bit of traceFlags. */
  sampled: boolean;
}

const TRACEPARENT_RE = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;
const ZERO_TRACE_ID = "0".repeat(32);
const ZERO_PARENT_ID = "0".repeat(16);

/**
 * Parse a W3C Trace Context `traceparent` header value
 * (https://www.w3.org/TR/trace-context/). Returns `undefined` for anything
 * the spec says vendors MUST ignore: wrong shape, non-lowercase-hex fields,
 * forbidden version `ff`, or all-zero trace-id / parent-id.
 */
export function parseTraceparent(value: string | undefined): TraceparentData | undefined {
  if (typeof value !== "string") return undefined;
  const m = TRACEPARENT_RE.exec(value.trim());
  if (!m) return undefined;
  const version = m[VALUE_1];
  const traceId = m[2];
  const parentId = m[3];
  const traceFlags = m[4];
  if (version === "ff") return undefined;
  if (traceId === ZERO_TRACE_ID || parentId === ZERO_PARENT_ID) return undefined;
  return {
    version,
    traceId,
    parentId,
    traceFlags,
    sampled: (Number.parseInt(traceFlags, 16) & VALUE_1) === VALUE_1,
  };
}
