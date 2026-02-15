/**
 * Slugify, strip diacritics, and mask string.
 */

import { escapeRegExp } from "./string-escape";

export type SlugifyOptions = { separator?: string; lower?: boolean };
export type MaskOptions = { maskChar?: string };

export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function slugify(value: string, options: SlugifyOptions = {}): string {
  const separator = options.separator && options.separator.length > 0 ? options.separator : "-";
  const lower = options.lower ?? true;
  const normalized = stripDiacritics(value);
  const replaced = normalized.replace(/[^a-zA-Z0-9]+/g, separator);
  const escapedSeparator = escapeRegExp(separator);
  const collapsed = replaced.replace(new RegExp(`${escapedSeparator}{2,}`, "g"), separator);
  const trimmed = collapsed.replace(
    new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"),
    "",
  );
  return lower ? trimmed.toLowerCase() : trimmed;
}

export function maskString(
  value: string,
  visibleStart: number,
  visibleEnd: number,
  options: MaskOptions = {},
): string {
  const maskChar = options.maskChar && options.maskChar.length > 0 ? options.maskChar : "*";
  const start = Math.max(0, Math.min(visibleStart, value.length));
  const end = Math.max(0, Math.min(visibleEnd, value.length - start));
  const maskedLength = Math.max(0, value.length - start - end);
  const mask = maskChar.repeat(maskedLength);
  return `${value.slice(0, start)}${mask}${value.slice(value.length - end)}`;
}
