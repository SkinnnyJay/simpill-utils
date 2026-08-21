/**
 * Grapheme-cluster utilities (Unicode Standard Annex #29).
 *
 * JavaScript strings are UTF-16 code units, so `.length`, indexing and
 * `.slice()` operate below the level of user-perceived characters. A single
 * emoji, a ZWJ sequence (e.g. a family emoji), a regional-indicator flag or a
 * base letter plus combining marks can each span multiple code units. Cutting
 * a string at an arbitrary code-unit index therefore risks splitting a
 * grapheme cluster and emitting orphaned surrogates (rendered as U+FFFD).
 *
 * These helpers segment on grapheme boundaries using the built-in
 * `Intl.Segmenter` (available in Node >= 16, all modern engines). When the
 * runtime lacks `Intl.Segmenter`, they fall back to code-point iteration
 * (`Array.from`) which at least keeps surrogate pairs intact.
 */

interface SegmentDataLike {
  segment: string;
}
interface SegmenterLike {
  segment(input: string): Iterable<SegmentDataLike>;
}
type SegmenterCtor = new (
  locales?: string | string[] | undefined,
  options?: { granularity?: "grapheme" | "word" | "sentence" },
) => SegmenterLike;

const SegmenterImpl: SegmenterCtor | undefined = (Intl as unknown as { Segmenter?: SegmenterCtor })
  .Segmenter;

let cachedSegmenter: SegmenterLike | undefined;
function graphemeSegmenter(): SegmenterLike | undefined {
  if (!SegmenterImpl) {
    return undefined;
  }
  if (!cachedSegmenter) {
    cachedSegmenter = new SegmenterImpl(undefined, { granularity: "grapheme" });
  }
  return cachedSegmenter;
}

// Fast path: a string with no code unit above 0x7F is pure ASCII, where one
// code unit == one grapheme, so we can skip segmentation entirely.
const NON_ASCII = /[\u0080-\uFFFF]/;

/** True if the string contains only ASCII (U+0000..U+007F) code units. */
export function isAscii(value: string): boolean {
  return !NON_ASCII.test(value);
}

/** Split a string into an array of grapheme clusters (user-perceived chars). */
export function toGraphemes(value: string): string[] {
  if (value.length === 0) {
    return [];
  }
  if (isAscii(value)) {
    return value.split("");
  }
  const seg = graphemeSegmenter();
  if (seg) {
    const out: string[] = [];
    for (const s of seg.segment(value)) {
      out.push(s.segment);
    }
    return out;
  }
  // No Intl.Segmenter: code-point iteration keeps astral chars whole.
  return Array.from(value);
}

/** Count grapheme clusters (what a user would perceive as characters). */
export function graphemeLength(value: string): number {
  if (isAscii(value)) {
    return value.length;
  }
  const seg = graphemeSegmenter();
  if (seg) {
    let n = 0;
    for (const _ of seg.segment(value)) {
      n += 1;
    }
    return n;
  }
  return Array.from(value).length;
}

/**
 * Slice by grapheme cluster index (never splits a cluster).
 * Semantics mirror Array.prototype.slice on the grapheme array.
 */
export function sliceGraphemes(value: string, start?: number, end?: number): string {
  if (isAscii(value)) {
    return value.slice(start, end);
  }
  return toGraphemes(value).slice(start, end).join("");
}

/** Reverse a string on grapheme boundaries (keeps emoji/combining intact). */
export function reverseGraphemes(value: string): string {
  return toGraphemes(value).reverse().join("");
}
