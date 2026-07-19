/**
 * Slugify, diacritic stripping, ASCII folding, and masking.
 */

import { isAscii, toGraphemes } from "./grapheme";
import { escapeRegExp } from "./string-escape";

export type SlugifyOptions = {
  separator?: string;
  lower?: boolean;
  /**
   * When true (default), the slug is ASCII-only: Latin letters are folded to
   * ASCII and every non-ASCII-alphanumeric run becomes the separator. When
   * false, Unicode letters and numbers are preserved (marks stripped), so
   * non-Latin scripts (Cyrillic, Greek, CJK, ...) survive instead of being
   * erased. Defaults to true for backward compatibility.
   */
  strict?: boolean;
};
export type MaskOptions = { maskChar?: string };

/**
 * Single-codepoint Latin letters that carry a diacritic (stroke/hook/bar) but
 * have NO canonical NFD decomposition, so NFD + mark-stripping alone leaves
 * them intact. Mapped to their base letter.
 */
const STROKE_MAP: Record<string, string> = {
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  ħ: "h",
  Ħ: "H",
  ŧ: "t",
  Ŧ: "T",
  ı: "i",
  ĸ: "k",
  ẛ: "s",
  ſ: "s",
};

/**
 * Latin letters/ligatures that expand to multiple ASCII letters. Applied only
 * by foldToAscii (they are transliterations, not diacritic removal).
 */
const MULTIGRAPH_MAP: Record<string, string> = {
  ß: "ss",
  ẞ: "SS",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  þ: "th",
  Þ: "Th",
  ð: "d",
  Ð: "D",
  ĳ: "ij",
  Ĳ: "IJ",
};

function charClassFrom(map: Record<string, string>): RegExp {
  return new RegExp(
    `[${Object.keys(map)
      .map((c) => escapeRegExp(c))
      .join("")}]`,
    "gu",
  );
}

const STROKE_RE = charClassFrom(STROKE_MAP);
const FOLD_MAP: Record<string, string> = { ...STROKE_MAP, ...MULTIGRAPH_MAP };
const FOLD_RE = charClassFrom(FOLD_MAP);
const MARKS_RE = /\p{M}+/gu;

/**
 * Remove diacritical marks. Decomposes to NFD, strips ALL Unicode combining
 * marks (every \p{M} block, not just U+0300..U+036F), then maps single-letter
 * stroke/hook forms (ø, ł, đ, ...) that do not decompose. "Crème" -> "Creme",
 * "Łódź" -> "Lodz".
 */
export function stripDiacritics(value: string): string {
  if (isAscii(value)) {
    return value;
  }
  const stripped = value.normalize("NFD").replace(MARKS_RE, "");
  STROKE_RE.lastIndex = 0;
  return stripped.replace(STROKE_RE, (ch) => STROKE_MAP[ch] ?? ch);
}

/**
 * Fold a string to ASCII: strip diacritics AND expand Latin multigraphs
 * (ß -> ss, æ -> ae, œ -> oe, þ -> th, ...). Non-Latin scripts are left as-is
 * (this is not a transliterator). "Straße" -> "Strasse".
 */
export function foldToAscii(value: string): string {
  if (isAscii(value)) {
    return value;
  }
  const stripped = value.normalize("NFD").replace(MARKS_RE, "");
  FOLD_RE.lastIndex = 0;
  return stripped.replace(FOLD_RE, (ch) => FOLD_MAP[ch] ?? ch);
}

// Precompiled fast paths for the default "-" separator (avoids building three
// RegExp objects on every call, which the original implementation did).
const DEFAULT_NON_ALNUM_ASCII = /[^a-zA-Z0-9]+/g;
const DEFAULT_NON_ALNUM_UNICODE = /[^\p{L}\p{N}]+/gu;
const DEFAULT_DASH_COLLAPSE = /-{2,}/g;
const DEFAULT_DASH_TRIM = /^-+|-+$/g;

export function slugify(value: string, options: SlugifyOptions = {}): string {
  const separator = options.separator && options.separator.length > 0 ? options.separator : "-";
  const lower = options.lower ?? true;
  const strict = options.strict ?? true;

  const base = strict ? foldToAscii(value) : value.normalize("NFC");

  let replaced: string;
  let collapsed: string;
  let trimmed: string;

  if (separator === "-") {
    replaced = base.replace(strict ? DEFAULT_NON_ALNUM_ASCII : DEFAULT_NON_ALNUM_UNICODE, "-");
    collapsed = replaced.replace(DEFAULT_DASH_COLLAPSE, "-");
    trimmed = collapsed.replace(DEFAULT_DASH_TRIM, "");
  } else {
    const nonAlnum = strict ? /[^a-zA-Z0-9]+/g : /[^\p{L}\p{N}]+/gu;
    replaced = base.replace(nonAlnum, separator);
    const esc = escapeRegExp(separator);
    collapsed = replaced.replace(new RegExp(`${esc}{2,}`, "g"), separator);
    trimmed = collapsed.replace(new RegExp(`^${esc}|${esc}$`, "g"), "");
  }

  return lower ? trimmed.toLowerCase() : trimmed;
}

export function maskString(
  value: string,
  visibleStart: number,
  visibleEnd: number,
  options: MaskOptions = {},
): string {
  const maskChar = options.maskChar && options.maskChar.length > 0 ? options.maskChar : "*";
  // Operate on grapheme clusters so emoji / combining marks are never split
  // into orphaned surrogates.
  const graphemes = toGraphemes(value);
  const total = graphemes.length;
  const start = Math.max(0, Math.min(visibleStart, total));
  const end = Math.max(0, Math.min(visibleEnd, total - start));
  const maskedLength = Math.max(0, total - start - end);
  const head = graphemes.slice(0, start).join("");
  const tail = end === 0 ? "" : graphemes.slice(total - end).join("");
  return `${head}${maskChar.repeat(maskedLength)}${tail}`;
}
