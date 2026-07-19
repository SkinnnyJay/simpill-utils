/**
 * Truncate and word-wrap utilities (grapheme-cluster aware).
 */

import { graphemeLength, sliceGraphemes } from "./grapheme";
import { splitLines } from "./string-escape";

const NON_ASCII = /[\u0080-\uFFFF]/;

export type TruncateOptions = { ellipsis?: string };
export type TruncateWordsOptions = { ellipsis?: string };
export type WrapOptions = { breakLongWords?: boolean; newline?: string };

/**
 * Truncate to at most `maxLength` grapheme clusters, appending `ellipsis`
 * (default "..."). Length is measured in user-perceived characters, so emoji,
 * flags, ZWJ sequences and combining marks are never cut in half (the original
 * code-unit `slice` could emit orphaned surrogates). Pure-ASCII input keeps its
 * original, byte-for-byte behavior via a fast path.
 */
export function truncate(value: string, maxLength: number, options: TruncateOptions = {}): string {
  if (maxLength <= 0) {
    return "";
  }
  // Code units >= graphemes, so anything within maxLength code units always fits.
  if (value.length <= maxLength) {
    return value;
  }
  const ellipsis = options.ellipsis ?? "...";

  // ASCII fast path: if the first maxLength+1 code units are ASCII, the string
  // holds more than maxLength graphemes and the cut index lands between two
  // ASCII units, so the original code-unit slice is provably grapheme-safe --
  // no need to scan the (possibly long) tail.
  if (
    !NON_ASCII.test(value.slice(0, maxLength + 1)) &&
    (ellipsis === "..." || !NON_ASCII.test(ellipsis))
  ) {
    if (ellipsis.length >= maxLength) {
      return ellipsis.slice(0, maxLength);
    }
    return value.slice(0, maxLength - ellipsis.length) + ellipsis;
  }

  const valueLen = graphemeLength(value);
  if (valueLen <= maxLength) {
    return value;
  }
  const ellipsisLen = graphemeLength(ellipsis);
  if (ellipsisLen >= maxLength) {
    return sliceGraphemes(ellipsis, 0, maxLength);
  }
  return sliceGraphemes(value, 0, maxLength - ellipsisLen) + ellipsis;
}

export function truncateWords(
  value: string,
  maxWords: number,
  options: TruncateWordsOptions = {},
): string {
  if (maxWords <= 0) {
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) {
    return trimmed;
  }
  const ellipsis = options.ellipsis ?? "...";
  return `${words.slice(0, maxWords).join(" ")}${ellipsis}`;
}

function breakLongWord(word: string, maxWidth: number): string[] {
  const out: string[] = [];
  const len = graphemeLength(word);
  for (let i = 0; i < len; i += maxWidth) {
    out.push(sliceGraphemes(word, i, i + maxWidth));
  }
  return out;
}

function wrapLine(value: string, maxWidth: number, breakLongWords: boolean): string[] {
  const words = value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";
  let currentWidth = 0;
  const pushCurrent = (): void => {
    if (current.length > 0) {
      lines.push(current);
      current = "";
      currentWidth = 0;
    }
  };

  for (const word of words) {
    const wordWidth = graphemeLength(word);
    if (currentWidth === 0) {
      if (breakLongWords && wordWidth > maxWidth) {
        lines.push(...breakLongWord(word, maxWidth));
        continue;
      }
      current = word;
      currentWidth = wordWidth;
      continue;
    }
    if (currentWidth + 1 + wordWidth <= maxWidth) {
      current = `${current} ${word}`;
      currentWidth += 1 + wordWidth;
      continue;
    }
    pushCurrent();
    if (breakLongWords && wordWidth > maxWidth) {
      lines.push(...breakLongWord(word, maxWidth));
      continue;
    }
    current = word;
    currentWidth = wordWidth;
  }
  pushCurrent();
  return lines;
}

export function wrapText(value: string, maxWidth: number, options: WrapOptions = {}): string {
  if (maxWidth <= 0) {
    return "";
  }
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
