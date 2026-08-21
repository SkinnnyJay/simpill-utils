/**
 * Case conversion (Unicode- and acronym-aware, optionally locale-sensitive).
 */

// Word-boundary insertion:
//  1. lower/number followed by an uppercase letter  -> camelCase hump
//  2. an uppercase run followed by Upper+lower       -> acronym boundary
//     (so "XMLHttpRequest" -> "XML Http Request", "getHTTPCode" -> "get HTTP Code")
// Both use Unicode property escapes so accented and non-Latin letters split too.
const CAMEL_HUMP = /([\p{Ll}\p{N}])(\p{Lu})/gu;
const ACRONYM_BOUNDARY = /(\p{Lu}+)(\p{Lu}\p{Ll})/gu;
const SEPARATORS = /[_-]+/gu;
const WHITESPACE = /\s+/gu;

/** Split a string into normalized words (original case preserved per word). */
export function splitWords(value: string): string[] {
  const spaced = value
    .replace(CAMEL_HUMP, "$1 $2")
    .replace(ACRONYM_BOUNDARY, "$1 $2")
    .replace(SEPARATORS, " ")
    .replace(WHITESPACE, " ")
    .trim();
  return spaced.length === 0 ? [] : spaced.split(" ");
}

function lower(value: string, locale?: string): string {
  return locale ? value.toLocaleLowerCase(locale) : value.toLowerCase();
}

/** Uppercase the first code point (not code unit), optionally locale-aware. */
function capitalizeWord(word: string, locale?: string): string {
  if (word.length === 0) {
    return "";
  }
  const cp = word.codePointAt(0);
  if (cp === undefined) {
    return word;
  }
  const first = String.fromCodePoint(cp);
  const upperFirst = locale ? first.toLocaleUpperCase(locale) : first.toUpperCase();
  return upperFirst + word.slice(first.length);
}

function words(value: string, locale?: string): string[] {
  return splitWords(value).map((w) => lower(w, locale));
}

/**
 * Convert string to camelCase (e.g. "foo bar" -> "fooBar").
 * @param value - Input string
 * @param locale - Optional BCP-47 locale for case mapping (e.g. "tr")
 */
export function toCamelCase(value: string, locale?: string): string {
  return words(value, locale)
    .map((word, index) => (index === 0 ? word : capitalizeWord(word, locale)))
    .join("");
}

/**
 * Convert string to PascalCase (e.g. "foo bar" -> "FooBar").
 * @param value - Input string
 * @param locale - Optional BCP-47 locale for case mapping
 */
export function toPascalCase(value: string, locale?: string): string {
  return words(value, locale)
    .map((word) => capitalizeWord(word, locale))
    .join("");
}

/**
 * Convert string to kebab-case (e.g. "foo bar" -> "foo-bar").
 * @param value - Input string
 * @param locale - Optional BCP-47 locale for case mapping
 */
export function toKebabCase(value: string, locale?: string): string {
  return words(value, locale).join("-");
}

/**
 * Convert string to snake_case (e.g. "foo bar" -> "foo_bar").
 * @param value - Input string
 * @param locale - Optional BCP-47 locale for case mapping
 */
export function toSnakeCase(value: string, locale?: string): string {
  return words(value, locale).join("_");
}

/**
 * Convert string to Title Case (e.g. "foo bar" -> "Foo Bar").
 * @param value - Input string
 * @param locale - Optional BCP-47 locale for case mapping
 */
export function toTitleCase(value: string, locale?: string): string {
  return words(value, locale)
    .map((word) => capitalizeWord(word, locale))
    .join(" ");
}
