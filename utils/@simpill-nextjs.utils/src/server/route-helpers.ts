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

/** Parse and validate search params with Zod; returns { success, data } or { success: false, error }. */
export function parseSearchParams<Schema extends z.ZodType>(
  request: { url?: string; nextUrl?: { searchParams?: URLSearchParams } },
  schema: Schema
): { success: true; data: z.infer<Schema> } | { success: false; error: z.ZodError } {
  const params = getSearchParamsFromRequest(request);
  const obj = Object.fromEntries(params.entries());
  const result = schema.safeParse(obj);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/** Create a JSON Response (for Route Handlers). NextResponse is from next/server. */
export function jsonResponse(
  data: unknown,
  status = HTTP_STATUS_OK,
  init?: ResponseInit
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });
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
      : { error: err instanceof Error ? err.message : String(err) };
  return jsonResponse(payload, status, init);
}
