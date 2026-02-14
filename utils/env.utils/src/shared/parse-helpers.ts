import { BOOLEAN_FALSY, BOOLEAN_TRUTHY, ENV_PARSE_TYPE } from "./constants";
import { EnvParseError, EnvValidationError } from "./errors";

export function parseNumberEnvValue(rawValue: string, defaultValue: number): number {
  if (rawValue === "") {
    return defaultValue;
  }
  const parsedValue: number = Number(rawValue);
  return Number.isNaN(parsedValue) ? defaultValue : parsedValue;
}

export function parseBooleanEnvValue(rawValue: string, defaultValue: boolean): boolean {
  if (rawValue === "") {
    return defaultValue;
  }
  const normalizedValue: string = rawValue.toLowerCase();
  if (normalizedValue === BOOLEAN_TRUTHY.TRUE || normalizedValue === BOOLEAN_TRUTHY.ONE) {
    return true;
  }
  if (normalizedValue === BOOLEAN_FALSY.FALSE || normalizedValue === BOOLEAN_FALSY.ZERO) {
    return false;
  }
  return defaultValue;
}

/** @throws {EnvParseError} If the value cannot be parsed as a number */
export function parseNumberEnvValueStrict(key: string, rawValue: string): number {
  if (rawValue === "") {
    throw new EnvParseError(key, rawValue, ENV_PARSE_TYPE.NUMBER);
  }
  const parsedValue: number = Number(rawValue);
  if (Number.isNaN(parsedValue)) {
    throw new EnvParseError(key, rawValue, ENV_PARSE_TYPE.NUMBER);
  }
  return parsedValue;
}

/** @throws {EnvParseError} If the value cannot be parsed as a boolean */
export function parseBooleanEnvValueStrict(key: string, rawValue: string): boolean {
  if (rawValue === "") {
    throw new EnvParseError(key, rawValue, ENV_PARSE_TYPE.BOOLEAN);
  }
  const normalizedValue: string = rawValue.toLowerCase();
  if (normalizedValue === BOOLEAN_TRUTHY.TRUE || normalizedValue === BOOLEAN_TRUTHY.ONE) {
    return true;
  }
  if (normalizedValue === BOOLEAN_FALSY.FALSE || normalizedValue === BOOLEAN_FALSY.ZERO) {
    return false;
  }
  throw new EnvParseError(key, rawValue, ENV_PARSE_TYPE.BOOLEAN);
}

/**
 * Parse env value as one of the allowed strings (case-sensitive by default).
 * Returns default when raw is empty or not in allowed list.
 */
export function parseEnvEnum<T extends string>(
  rawValue: string,
  allowed: readonly T[],
  defaultValue: T,
  options?: { caseInsensitive?: boolean },
): T {
  if (rawValue === "") {
    return defaultValue;
  }
  const match = allowed.find(
    (a) => (options?.caseInsensitive ? a.toLowerCase() : a) === (options?.caseInsensitive ? rawValue.toLowerCase() : rawValue),
  );
  return match ?? defaultValue;
}

/** @throws {EnvValidationError} If raw is empty or not in allowed list */
export function parseEnvEnumStrict<T extends string>(
  key: string,
  rawValue: string,
  allowed: readonly T[],
  options?: { caseInsensitive?: boolean },
): T {
  if (rawValue === "") {
    throw new EnvValidationError(key, rawValue, "value is required");
  }
  const match = allowed.find(
    (a) => (options?.caseInsensitive ? a.toLowerCase() : a) === (options?.caseInsensitive ? rawValue.toLowerCase() : rawValue),
  );
  if (match === undefined) {
    throw new EnvValidationError(
      key,
      rawValue,
      `must be one of: ${allowed.join(", ")}`,
    );
  }
  return match;
}
