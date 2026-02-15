import {
  capitalize,
  coalesceStrings,
  decapitalize,
  ensurePrefix,
  ensureSuffix,
  escapeHtml,
  escapeRegExp,
  hasOnlyDigits,
  hasOnlyLetters,
  isAlphaNumeric,
  isBlank,
  isEmpty,
  isNullOrEmpty,
  isNullOrWhitespace,
  maskString,
  normalizeWhitespace,
  padEndSafe,
  padStartSafe,
  replaceAllSafe,
  safeLower,
  safeUpper,
  slugify,
  splitLines,
  stripAnsi,
  stripDiacritics,
  stripIndent,
  toSentenceCase,
  trimToNull,
  truncate,
  truncateWords,
  unescapeHtml,
  wrapText,
} from "../../../src/shared/string.utils";

describe("string utils", () => {
  it("checks for empty and blank values", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isBlank("   ")).toBe(true);
    expect(isBlank("text")).toBe(false);
  });

  it("truncates with ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
    expect(truncate("hello", 8)).toBe("hello");
    expect(truncate("hello", 2)).toBe("..");
  });

  it("truncates words", () => {
    expect(truncateWords("one two three", 2)).toBe("one two...");
    expect(truncateWords("one two", 3)).toBe("one two");
  });

  it("trims to null", () => {
    expect(trimToNull(null)).toBeNull();
    expect(trimToNull("   ")).toBeNull();
    expect(trimToNull("  hello ")).toBe("hello");
  });

  it("ensures prefixes and suffixes", () => {
    expect(ensurePrefix("world", "hello ")).toBe("hello world");
    expect(ensurePrefix("hello world", "hello ")).toBe("hello world");
    expect(ensureSuffix("path", "/")).toBe("path/");
    expect(ensureSuffix("path/", "/")).toBe("path/");
  });

  it("normalizes whitespace", () => {
    expect(normalizeWhitespace("  a\tb \n c  ")).toBe("a b c");
  });

  it("splits lines across newlines", () => {
    expect(splitLines("a\r\nb\rc")).toEqual(["a", "b", "c"]);
  });

  it("wraps text into lines", () => {
    const input = "one two three four";
    expect(wrapText(input, 7)).toBe("one two\nthree\nfour");
    expect(wrapText("superlong", 4, { breakLongWords: true })).toBe("supe\nrlon\ng");
  });

  it("capitalizes and decapitalizes", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(decapitalize("Hello")).toBe("hello");
    expect(capitalize("")).toBe("");
  });

  it("converts to sentence case", () => {
    expect(toSentenceCase("  hELLO WORLD")).toBe("  Hello world");
  });

  it("strips shared indentation", () => {
    const input = "  one\n    two\n  three";
    expect(stripIndent(input)).toBe("one\n  two\nthree");
  });

  it("escapes and unescapes HTML", () => {
    const input = '<div>"&"</div>';
    const escaped = escapeHtml(input);
    expect(escaped).toBe("&lt;div&gt;&quot;&amp;&quot;&lt;/div&gt;");
    expect(unescapeHtml(escaped)).toBe(input);
  });

  it("escapes regex characters", () => {
    const input = ".*?+^$()[]{}|\\";
    const expected = "\\.\\*\\?\\+\\^\\$\\(\\)\\[\\]\\{\\}\\|\\\\";
    expect(escapeRegExp(input)).toBe(expected);
  });

  it("strips ANSI sequences", () => {
    expect(stripAnsi("\u001b[31mred\u001b[0m")).toBe("red");
  });

  it("strips diacritics and slugifies", () => {
    expect(stripDiacritics("Crème brûlée")).toBe("Creme brulee");
    expect(slugify("Crème brûlée")).toBe("creme-brulee");
  });

  it("masks sensitive values", () => {
    expect(maskString("123456", 2, 2)).toBe("12**56");
    expect(maskString("secret", 1, 1, { maskChar: "#" })).toBe("s####t");
  });

  it("isNullOrEmpty and isNullOrWhitespace alias isEmpty/isBlank", () => {
    expect(isNullOrEmpty("")).toBe(true);
    expect(isNullOrEmpty(null)).toBe(true);
    expect(isNullOrWhitespace("   ")).toBe(true);
    expect(isNullOrWhitespace("x")).toBe(false);
  });

  it("coalesceStrings returns first non-empty", () => {
    expect(coalesceStrings("", null, undefined, "a", "b")).toBe("a");
    expect(coalesceStrings("", null)).toBeUndefined();
  });

  it("padStartSafe and padEndSafe are null-safe", () => {
    expect(padStartSafe(null, 5)).toBe("");
    expect(padStartSafe("ab", 5, "0")).toBe("000ab");
    expect(padEndSafe(undefined, 5, "x")).toBe("");
    expect(padEndSafe("ab", 5, "x")).toBe("abxxx");
  });

  it("hasOnlyDigits, hasOnlyLetters, isAlphaNumeric", () => {
    expect(hasOnlyDigits("123")).toBe(true);
    expect(hasOnlyDigits("12a")).toBe(false);
    expect(hasOnlyDigits(null)).toBe(false);
    expect(hasOnlyLetters("abc")).toBe(true);
    expect(hasOnlyLetters("a1")).toBe(false);
    expect(isAlphaNumeric("a1B")).toBe(true);
    expect(isAlphaNumeric("a-1")).toBe(false);
  });

  it("replaceAllSafe is null-safe and replaces all", () => {
    expect(replaceAllSafe(null, "a", "b")).toBe("");
    expect(replaceAllSafe("aaa", "a", "b")).toBe("bbb");
  });

  it("safeLower and safeUpper are null-safe", () => {
    expect(safeLower(null)).toBe("");
    expect(safeLower("ABC")).toBe("abc");
    expect(safeUpper(undefined)).toBe("");
    expect(safeUpper("abc")).toBe("ABC");
  });
});
