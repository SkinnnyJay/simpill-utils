import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toTitleCase,
} from "../../../src/shared/case.utils";
import {
  capitalize,
  decapitalize,
  foldToAscii,
  graphemeLength,
  hasOnlyLetters,
  hasOnlyUnicodeLetters,
  isAscii,
  isUnicodeAlphaNumeric,
  maskString,
  replaceAllSafe,
  reverseGraphemes,
  sliceGraphemes,
  slugify,
  stripAnsi,
  stripDiacritics,
  toGraphemes,
  toSentenceCase,
  truncate,
  wrapText,
} from "../../../src/shared/string.utils";

const FAMILY = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}"; // 👨‍👩‍👧‍👦
const GRIN = "\u{1F600}"; // 😀
const WAVE_TONE = "\u{1F44D}\u{1F3FD}"; // 👍🏽
const JP = "\u{1F1EF}\u{1F1F5}"; // 🇯🇵
const CAFE_NFD = "cafe\u0301"; // café (decomposed)
// Detects ONLY orphaned/lone surrogates (a valid surrogate PAIR is fine).
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

describe("grapheme helpers", () => {
  it("segments ZWJ sequences, flags and skin tones as single graphemes", () => {
    expect(toGraphemes(`a${FAMILY}b`)).toEqual(["a", FAMILY, "b"]);
    expect(graphemeLength(FAMILY)).toBe(1);
    expect(graphemeLength(JP)).toBe(1);
    expect(graphemeLength(WAVE_TONE)).toBe(1);
    expect(graphemeLength(`${GRIN}${GRIN}${GRIN}`)).toBe(3);
  });

  it("isAscii distinguishes pure-ASCII from the rest", () => {
    expect(isAscii("hello world 123")).toBe(true);
    expect(isAscii(CAFE_NFD)).toBe(false);
    expect(isAscii(GRIN)).toBe(false);
  });

  it("sliceGraphemes and reverseGraphemes never split a cluster", () => {
    expect(sliceGraphemes(`${GRIN}${GRIN}${GRIN}`, 1, 2)).toBe(GRIN);
    expect(reverseGraphemes(`abc${WAVE_TONE}`)).toBe(`${WAVE_TONE}cba`);
    // no orphaned surrogates
    expect(LONE_SURROGATE.test(reverseGraphemes(`x${FAMILY}`))).toBe(false);
  });
});

describe("truncate is grapheme-safe", () => {
  it("keeps ASCII behavior byte-for-byte (back-compat)", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
    expect(truncate("hello", 8)).toBe("hello");
    expect(truncate("hello", 2)).toBe("..");
  });

  it("never emits orphaned surrogates when cutting emoji", () => {
    const out = truncate(`${GRIN}${GRIN}${GRIN}${GRIN}${GRIN}`, 3, { ellipsis: "" });
    expect(out).toBe(`${GRIN}${GRIN}${GRIN}`);
    expect(LONE_SURROGATE.test(out)).toBe(false);
  });

  it("does not sever a combining mark from its base", () => {
    // "café" (decomposed) is 4 graphemes / 5 code units; must stay intact at 4.
    expect(truncate(CAFE_NFD, 4, { ellipsis: "" })).toBe(CAFE_NFD);
  });
});

describe("maskString is grapheme-safe", () => {
  it("keeps ASCII behavior (back-compat)", () => {
    expect(maskString("123456", 2, 2)).toBe("12**56");
    expect(maskString("secret", 1, 1, { maskChar: "#" })).toBe("s####t");
  });

  it("masks around whole emoji without splitting surrogates", () => {
    const out = maskString(`${GRIN}${GRIN}${GRIN}${GRIN}`, 1, 1);
    expect(out).toBe(`${GRIN}**${GRIN}`);
    expect(LONE_SURROGATE.test(out)).toBe(false);
  });
});

describe("stripDiacritics and foldToAscii", () => {
  it("keeps the original diacritic behavior (back-compat)", () => {
    expect(stripDiacritics("Cr\u00E8me br\u00FBl\u00E9e")).toBe("Creme brulee");
  });

  it("strips marks from every combining block and handles stroke letters", () => {
    expect(stripDiacritics("\u0141\u00F3d\u017A")).toBe("Lodz"); // Łódź
    expect(stripDiacritics(`a\u1AB0`)).toBe("a"); // extended combining mark
  });

  it("foldToAscii expands Latin multigraphs", () => {
    expect(foldToAscii("Stra\u00DFe")).toBe("Strasse"); // ß -> ss
    expect(foldToAscii("\u00E6\u0153\u00FE")).toBe("aeoeth"); // æœþ
  });
});

describe("slugify Unicode correctness", () => {
  it("keeps the ASCII/Latin behavior and fixes the mangling (back-compat + fix)", () => {
    expect(slugify("Cr\u00E8me br\u00FBl\u00E9e")).toBe("creme-brulee");
    expect(slugify("Stra\u00DFe")).toBe("strasse"); // was "stra-e"
    expect(slugify("\u0141\u00F3d\u017A")).toBe("lodz"); // was "odz"
    expect(slugify("BAR and baz", { separator: "_" })).toBe("bar_and_baz");
    expect(slugify("Deja Vu", { lower: false })).toBe("Deja-Vu");
  });

  it("preserves non-Latin scripts when strict is disabled (was total data loss)", () => {
    expect(slugify("\u041F\u0440\u0438\u0432\u0435\u0442, \u043C\u0438\u0440")).toBe(""); // strict default
    expect(
      slugify("\u041F\u0440\u0438\u0432\u0435\u0442, \u043C\u0438\u0440", { strict: false }),
    ).toBe("\u043F\u0440\u0438\u0432\u0435\u0442-\u043C\u0438\u0440");
    expect(slugify("\u6771\u4EAC\u30BF\u30EF\u30FC", { strict: false })).toBe(
      "\u6771\u4EAC\u30BF\u30EF\u30FC",
    );
  });
});

describe("case conversion: acronyms, Unicode, locale", () => {
  it("keeps the pinned fixture (back-compat)", () => {
    const input = "hello_world-fooBar Baz";
    expect(toCamelCase(input)).toBe("helloWorldFooBarBaz");
    expect(toPascalCase(input)).toBe("HelloWorldFooBarBaz");
    expect(toKebabCase(input)).toBe("hello-world-foo-bar-baz");
    expect(toTitleCase(input)).toBe("Hello World Foo Bar Baz");
  });

  it("splits acronym boundaries correctly", () => {
    expect(toKebabCase("XMLHttpRequest")).toBe("xml-http-request"); // was xmlhttp-request
    expect(toKebabCase("getHTTPResponseCode")).toBe("get-http-response-code");
    expect(toCamelCase("XMLHttpRequest")).toBe("xmlHttpRequest");
  });

  it("splits accented / non-Latin camelCase (Unicode-aware)", () => {
    expect(toKebabCase("f\u00F6oB\u00E4r")).toBe("f\u00F6o-b\u00E4r"); // föoBär -> föo-bär
  });

  it("honors locale casing (Turkish dotted I)", () => {
    expect(toPascalCase("istanbul", "tr")).toBe("\u0130stanbul"); // İstanbul
    expect(capitalize("istanbul", "tr")).toBe("\u0130stanbul");
    expect(capitalize("istanbul")).toBe("Istanbul");
  });
});

describe("capitalize / decapitalize / toSentenceCase are code-point safe", () => {
  it("uppercases an astral first character (Deseret has case mapping)", () => {
    // 𐐨 (U+10428) uppercases to 𐐀 (U+10400); the old code-unit approach left it unchanged.
    if ("\u{10428}".toUpperCase() === "\u{10400}") {
      expect(capitalize("\u{10428}x")).toBe("\u{10400}x");
    }
    expect(decapitalize("\u{10400}X")).toBe("\u{10428}X");
  });

  it("keeps ASCII sentence-case (back-compat)", () => {
    expect(toSentenceCase("  hELLO WORLD")).toBe("  Hello world");
  });
});

describe("replaceAllSafe truly replaces all", () => {
  it("replaces every match even for a non-global regex", () => {
    expect(replaceAllSafe("a1a2a3", /a/, "X")).toBe("X1X2X3"); // was "X1a2a3"
    expect(replaceAllSafe("a1a2a3", /a/g, "X")).toBe("X1X2X3");
    expect(replaceAllSafe("aaa", "a", "b")).toBe("bbb");
    expect(replaceAllSafe(null, "a", "b")).toBe("");
  });
});

describe("stripAnsi covers CSI and OSC, not just colors", () => {
  it("keeps SGR color stripping (back-compat)", () => {
    expect(stripAnsi("\u001b[31mred\u001b[0m")).toBe("red");
  });

  it("strips OSC-8 hyperlinks and cursor/erase sequences", () => {
    expect(stripAnsi("\u001b]8;;http://x\u0007link\u001b]8;;\u0007")).toBe("link");
    expect(stripAnsi("\u001b[2J\u001b[1;1Hhi")).toBe("hi");
  });
});

describe("Unicode predicates", () => {
  it("hasOnlyUnicodeLetters accepts any script; ASCII variant does not", () => {
    expect(hasOnlyLetters("caf\u00E9")).toBe(false);
    expect(hasOnlyUnicodeLetters("caf\u00E9")).toBe(true);
    expect(isUnicodeAlphaNumeric("caf\u00E9123")).toBe(true);
    expect(isUnicodeAlphaNumeric("caf\u00E9-1")).toBe(false);
  });
});

describe("wrapText breaks long words on grapheme boundaries", () => {
  it("keeps ASCII behavior (back-compat)", () => {
    expect(wrapText("one two three four", 7)).toBe("one two\nthree\nfour");
    expect(wrapText("superlong", 4, { breakLongWords: true })).toBe("supe\nrlon\ng");
  });

  it("does not split emoji when breaking a long run", () => {
    const out = wrapText(`${GRIN}${GRIN}${GRIN}${GRIN}`, 2, { breakLongWords: true });
    expect(out).toBe(`${GRIN}${GRIN}\n${GRIN}${GRIN}`);
    expect(LONE_SURROGATE.test(out.replace(/\n/g, ""))).toBe(false);
  });
});
