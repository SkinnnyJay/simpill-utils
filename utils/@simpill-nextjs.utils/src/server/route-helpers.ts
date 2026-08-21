import { serializeError } from "@simpill/errors.utils";
import type { z } from "zod";

/** HTTP status codes for route responses. */
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
/** Minimum status code for server error (5xx). */
const HTTP_STATUS_SERVER_ERROR_MIN = 500;

/** Build URLSearchParams from Request (e.g. request.nextUrl.searchParams or request.url). */
export function getSearchParamsFromRequest(request: {
  url?: string;
  nextUrl?: { searchParams?: URLSearchParams };
}): URLSearchParams {
  if (request.nextUrl?.searchParams) {
    return request.nextUrl.searchParams;
  }
  if (request.url) {
    const u = new URL(request.url);
    return u.searchParams;
  }
  return new URLSearchParams();
}

export interface ParseSearchParamsOptions {
  /**
   * How repeated query keys (?tag=a&tag=b) are represented before validation:
   * - "last"  (default, pre-uplift behavior): last value wins, earlier values dropped
   * - "first": first value wins
   * - "array": repeated keys become string[] (single values stay strings)
   */
  repeated?: "last" | "first" | "array";
}

/**
 * Converts URLSearchParams to a plain object for schema validation.
 * Object.fromEntries silently drops all but the last of repeated keys;
 * pass { repeated: "array" } to preserve them.
 */
export function searchParamsToObject(
  params: URLSearchParams,
  options: ParseSearchParamsOptions = {}
): Record<string, string | string[]> {
  const repeated = options.repeated ?? "last";
  if (repeated === "last") {
    return Object.fromEntries(params.entries());
  }
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    if (repeated === "array") {
      out[key] = all.length > 1 ? all : all[0];
    } else {
      out[key] = all[0];
    }
  }
  return out;
}

/** Parse and validate search params with Zod; returns { success, data } or { success: false, error }. */
export function parseSearchParams<Schema extends z.ZodType>(
  request: { url?: string; nextUrl?: { searchParams?: URLSearchParams } },
  schema: Schema,
  options: ParseSearchParamsOptions = {}
): { success: true; data: z.infer<Schema> } | { success: false; error: z.ZodError } {
  const params = getSearchParamsFromRequest(request);
  const obj = searchParamsToObject(params, options);
  const result = schema.safeParse(obj);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Create a JSON Response (for Route Handlers). NextResponse is from next/server.
 * Custom init.headers are MERGED with Content-Type: application/json instead of
 * replacing it (a caller-supplied Content-Type still wins). init.status keeps
 * overriding the status argument, matching the original spread semantics.
 */
export function jsonResponse(
  data: unknown,
  status = HTTP_STATUS_OK,
  init?: ResponseInit
): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const { headers: _replaced, ...rest } = init ?? {};
  // JSON.stringify(undefined) returns undefined -> empty body that res.json() cannot
  // parse; emit valid JSON "null" instead.
  const body = data === undefined ? "null" : JSON.stringify(data);
  return new Response(body, { status, ...rest, headers });
}

/** Best-effort readable message for non-Error values (String({}) is "[object Object]"). */
function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    const json = JSON.stringify(err);
    if (typeof json === "string") {
      return json;
    }
  } catch {
    // fall through to String()
  }
  return String(err);
}

/** Create a JSON error response; serializes Error for 5xx. */
export function errorResponse(
  err: unknown,
  status = HTTP_STATUS_INTERNAL_SERVER_ERROR,
  init?: ResponseInit
): Response {
  const payload =
    status >= HTTP_STATUS_SERVER_ERROR_MIN
      ? { error: serializeError(err, { includeStack: false }) }
      : { error: errorMessage(err) };
  return jsonResponse(payload, status, init);
}

/**
 * RFC 9457 Problem Details (application/problem+json).
 * Fields are caller-supplied only — no Error object is serialized, so internal
 * messages, stacks, and causes can never leak into the response by construction.
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [extension: string]: unknown;
}

/** Create an RFC 9457 problem+json Response. */
export function problemResponse(
  status: number,
  problem: Omit<ProblemDetails, "status"> = {},
  init?: ResponseInit
): Response {
  const body: ProblemDetails = { type: "about:blank", ...problem, status };
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/problem+json");
  const { headers: _replaced, ...rest } = init ?? {};
  return new Response(JSON.stringify(body), { status, ...rest, headers });
}
