/** Options for maskString (re-exported from string-slug-mask). */
export type { MaskOptions, SlugifyOptions } from "./string-slug-mask";
/** Options for truncate/wrap (re-exported from string-truncate-wrap). */
export type { TruncateOptions, TruncateWordsOptions, WrapOptions } from "./string-truncate-wrap";

/** True if value is null, undefined, or has length 0. */
export function isEmpty(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.length === 0;
}

/** True if value is null, undefined, or trim is empty. */
export function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0;
}

/** Trim value; return null if result is empty. */
export function trimToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Prepend prefix if value does not already start with it. */
export function ensurePrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value : `${prefix}${value}`;
}

/** Append suffix if value does not already end with it. */
export function ensureSuffix(value: string, suffix: string): string {
  return value.endsWith(suffix) ? value : `${value}${suffix}`;
}

/** Collapse runs of whitespace to single space and trim. */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Remove common leading indent from multiline string. */
export function stripIndent(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  if (nonEmpty.length === 0) {
    return value.trim().length === 0 ? "" : value;
  }

  const indent = Math.min(
    ...nonEmpty.map((line) => {
      const match = line.match(/^\s*/);
      return match ? match[0].length : 0;
    }),
  );

  return lines
    .map((line) => line.slice(indent))
    .join("\n")
    .replace(/\s+$/g, "");
}

/** First character uppercase, rest unchanged. */
export function capitalize(value: string): string {
  if (value.length === 0) {
    return "";
  }
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

/** First character lowercase, rest unchanged. */
export function decapitalize(value: string): string {
  if (value.length === 0) {
    return "";
  }
  return `${value[0].toLowerCase()}${value.slice(1)}`;
}

/** First character of first word uppercase; rest lowercase (sentence style). */
export function toSentenceCase(value: string): string {
  if (value.length === 0) {
    return "";
  }
  const firstNonSpace = value.search(/\S/);
  if (firstNonSpace === -1) {
    return value;
  }
  const lower = value.toLowerCase();
  const before = lower.slice(0, firstNonSpace);
  const capital = lower[firstNonSpace].toUpperCase();
  const after = lower.slice(firstNonSpace + 1);
  return `${before}${capital}${after}`;
}

/** Alias for isEmpty (null, undefined, or length 0). */
export const isNullOrEmpty = isEmpty;

/** Alias for isBlank (null, undefined, or trim is empty). */
export const isNullOrWhitespace = isBlank;

/** First non-empty string from the list, or undefined. */
export function coalesceStrings(...values: (string | null | undefined)[]): string | undefined {
  for (const v of values) {
    if (v != null && v.length > 0) return v;
  }
  return undefined;
}

/** Pad start; "" for null/undefined, else padStart. */
export function padStartSafe(
  value: string | null | undefined,
  maxLength: number,
  fillString?: string,
): string {
  if (value == null) return "";
  return value.padStart(maxLength, fillString);
}

/** Pad end; "" for null/undefined, else padEnd. */
export function padEndSafe(
  value: string | null | undefined,
  maxLength: number,
  fillString?: string,
): string {
  if (value == null) return "";
  return value.padEnd(maxLength, fillString);
}

const DIGITS_ONLY = /^\d+$/;
const LETTERS_ONLY = /^[a-zA-Z]+$/;
const ALPHANUMERIC = /^[a-zA-Z0-9]+$/;

/** True if value is non-null and contains only digit characters. */
export function hasOnlyDigits(value: string | null | undefined): boolean {
  return typeof value === "string" && value.length > 0 && DIGITS_ONLY.test(value);
}

/** True if value is non-null and contains only letter characters. */
export function hasOnlyLetters(value: string | null | undefined): boolean {
  return typeof value === "string" && value.length > 0 && LETTERS_ONLY.test(value);
}

/** True if value is non-null and contains only alphanumeric characters. */
export function isAlphaNumeric(value: string | null | undefined): boolean {
  return typeof value === "string" && value.length > 0 && ALPHANUMERIC.test(value);
}

/** Replace all occurrences; "" for null/undefined. */
export function replaceAllSafe(
  value: string | null | undefined,
  search: string | RegExp,
  replace: string,
): string {
  if (value == null) return "";
  if (typeof search === "string") {
    return value.split(search).join(replace);
  }
  return value.replace(search, replace);
}

/** Lowercase; returns "" for null/undefined. */
export function safeLower(value: string | null | undefined): string {
  return value == null ? "" : value.toLowerCase();
}

/** Uppercase; returns "" for null/undefined. */
export function safeUpper(value: string | null | undefined): string {
  return value == null ? "" : value.toUpperCase();
}

export { escapeHtml, escapeRegExp, splitLines, stripAnsi, unescapeHtml } from "./string-escape";
export { maskString, slugify, stripDiacritics } from "./string-slug-mask";
export { truncate, truncateWords, wrapText } from "./string-truncate-wrap";
