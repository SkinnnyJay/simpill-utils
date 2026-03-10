import { ERROR_PLACEHOLDER_MISSING_PREFIX, ERROR_PLACEHOLDER_MISSING_SUFFIX } from "./constants";

/** Values for placeholders: array (indexed by number) or record (by name). */
export type FormatValues = ReadonlyArray<unknown> | Record<string, unknown>;

/** Behavior when a placeholder has no value: ignore, empty string, or throw. */
export type MissingPlaceholderBehavior = "ignore" | "empty" | "throw";

/** Options for formatString: onMissing, stringify. */
export type FormatOptions = {
  onMissing?: MissingPlaceholderBehavior;
  stringify?: (value: unknown) => string;
};

const DEFAULT_STRINGIFY = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

type ResolvedValue = { found: true; value: unknown } | { found: false };

function resolveValue(values: FormatValues, key: string): ResolvedValue {
  if (Array.isArray(values)) {
    if (/^\d+$/.test(key)) {
      const index = Number(key);
      if (index < values.length) {
        return { found: true, value: values[index] };
      }
    }
    return { found: false };
  }

  const record = values as Record<string, unknown>;
  // biome-ignore lint/suspicious/noPrototypeBuiltins: safe hasOwnProperty check; Object.hasOwn requires ES2022
  if (Object.prototype.hasOwnProperty.call(record, key)) {
    return { found: true, value: record[key] };
  }

  return { found: false };
}

/**
 * Format a template string with {0} or {name} placeholders. Use "{{" and "}}" for literal braces.
 * @param template - String with {key} placeholders
 * @param values - Array (index) or record (name) of values
 * @param options - onMissing (ignore|empty|throw), stringify
 * @returns Formatted string
 * @throws If onMissing is "throw" and a placeholder is missing
 */
export function formatString(
  template: string,
  values: FormatValues,
  options: FormatOptions = {},
): string {
  const onMissing = options.onMissing ?? "ignore";
  const stringify = options.stringify ?? DEFAULT_STRINGIFY;

  let result = "";

  for (let i = 0; i < template.length; i += 1) {
    const char = template[i];
    if (char === "{") {
      const next = template[i + 1];
      if (next === "{") {
        result += "{";
        i += 1;
        continue;
      }

      const end = template.indexOf("}", i + 1);
      if (end === -1) {
        result += char;
        continue;
      }

      const rawKey = template.slice(i + 1, end);
      const key = rawKey.trim();

      if (key.length === 0) {
        result += "{}";
        i = end;
        continue;
      }

      const resolved = resolveValue(values, key);
      if (!resolved.found) {
        if (onMissing === "throw") {
          throw new Error(
            ERROR_PLACEHOLDER_MISSING_PREFIX + key + ERROR_PLACEHOLDER_MISSING_SUFFIX,
          );
        }
        if (onMissing === "ignore") {
          result += `{${rawKey}}`;
        }
        i = end;
        continue;
      }

      result += stringify(resolved.value);
      i = end;
      continue;
    }

    if (char === "}" && template[i + 1] === "}") {
      result += "}";
      i += 1;
      continue;
    }

    result += char;
  }

  return result;
}
