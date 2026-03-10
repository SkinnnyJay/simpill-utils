function toWords(value: string): string[] {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length === 0) {
    return [];
  }

  return normalized.split(" ").map((word) => word.toLowerCase());
}

function capitalize(word: string): string {
  if (word.length === 0) {
    return "";
  }
  return `${word[0].toUpperCase()}${word.slice(1)}`;
}

/**
 * Convert string to camelCase (e.g. "foo bar" -> "fooBar").
 * @param value - Input string
 * @returns camelCase string
 */
export function toCamelCase(value: string): string {
  const words = toWords(value);
  return words.map((word, index) => (index === 0 ? word : capitalize(word))).join("");
}

/**
 * Convert string to PascalCase (e.g. "foo bar" -> "FooBar").
 * @param value - Input string
 * @returns PascalCase string
 */
export function toPascalCase(value: string): string {
  return toWords(value)
    .map((word) => capitalize(word))
    .join("");
}

/**
 * Convert string to kebab-case (e.g. "foo bar" -> "foo-bar").
 * @param value - Input string
 * @returns kebab-case string
 */
export function toKebabCase(value: string): string {
  return toWords(value).join("-");
}

/**
 * Convert string to snake_case (e.g. "foo bar" -> "foo_bar").
 * @param value - Input string
 * @returns snake_case string
 */
export function toSnakeCase(value: string): string {
  return toWords(value).join("_");
}

/**
 * Convert string to Title Case (e.g. "foo bar" -> "Foo Bar").
 * @param value - Input string
 * @returns Title Case string
 */
export function toTitleCase(value: string): string {
  return toWords(value)
    .map((word) => capitalize(word))
    .join(" ");
}
