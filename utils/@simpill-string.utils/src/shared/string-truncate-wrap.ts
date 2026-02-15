/**
 * Truncate and word-wrap utilities.
 */

import { splitLines } from "./string-escape";

export type TruncateOptions = { ellipsis?: string };
export type TruncateWordsOptions = { ellipsis?: string };
export type WrapOptions = { breakLongWords?: boolean; newline?: string };

export function truncate(value: string, maxLength: number, options: TruncateOptions = {}): string {
  if (maxLength <= 0) return "";
  const ellipsis = options.ellipsis ?? "...";
  if (value.length <= maxLength) return value;
  if (ellipsis.length >= maxLength) return ellipsis.slice(0, maxLength);
  return value.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function truncateWords(
  value: string,
  maxWords: number,
  options: TruncateWordsOptions = {},
): string {
  if (maxWords <= 0) return "";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  const ellipsis = options.ellipsis ?? "...";
  return `${words.slice(0, maxWords).join(" ")}${ellipsis}`;
}

function wrapLine(value: string, maxWidth: number, breakLongWords: boolean): string[] {
  const words = value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  const pushCurrent = (): void => {
    if (current.length > 0) {
      lines.push(current);
      current = "";
    }
  };

  for (const word of words) {
    if (current.length === 0) {
      if (breakLongWords && word.length > maxWidth) {
        for (let i = 0; i < word.length; i += maxWidth) {
          lines.push(word.slice(i, i + maxWidth));
        }
        continue;
      }
      current = word;
      continue;
    }
    if (current.length + 1 + word.length <= maxWidth) {
      current = `${current} ${word}`;
      continue;
    }
    pushCurrent();
    if (breakLongWords && word.length > maxWidth) {
      for (let i = 0; i < word.length; i += maxWidth) {
        lines.push(word.slice(i, i + maxWidth));
      }
      continue;
    }
    current = word;
  }
  pushCurrent();
  return lines;
}

export function wrapText(value: string, maxWidth: number, options: WrapOptions = {}): string {
  if (maxWidth <= 0) return "";
  const newline = options.newline ?? "\n";
  const breakLongWords = options.breakLongWords ?? false;
  const lines = splitLines(value);
  const wrapped: string[] = [];
  for (const line of lines) {
    if (line.trim().length === 0) {
      wrapped.push("");
      continue;
    }
    wrapped.push(...wrapLine(line, maxWidth, breakLongWords));
  }
  return wrapped.join(newline);
}
