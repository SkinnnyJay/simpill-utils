import { MS_PER_SECOND } from "./constants";

/**
 * Parse a Retry-After header per RFC 9110 §10.2.3. Accepts delta-seconds
 * ("120") or an HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT").
 * @param headerValue - Raw header value (null/undefined tolerated)
 * @param now - Clock reference in ms for HTTP-date math (default Date.now())
 * @returns Milliseconds to wait (>= 0), or undefined when absent/unparseable
 */
export function parseRetryAfterMs(
  headerValue: string | null | undefined,
  now: number = Date.now(),
): number | undefined {
  if (!headerValue) return undefined;
  const trimmed = headerValue.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * MS_PER_SECOND;
  }
  // Signed/negative integers are invalid delta-seconds, not HTTP-dates
  // (Date.parse("-5") would otherwise parse as the year -5).
  if (/^[+-]?\d+$/.test(trimmed)) return undefined;
  const dateMs = Date.parse(trimmed);
  if (Number.isNaN(dateMs)) return undefined;
  return Math.max(0, dateMs - now);
}
