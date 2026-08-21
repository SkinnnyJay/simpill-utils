/**
 * Data validation helpers. No schema lib; simple predicates and results.
 */

import {
  ERROR_VALIDATION_ELEMENT_AT_INDEX_PREFIX,
  ERROR_VALIDATION_EXPECTED_ARRAY,
  ERROR_VALIDATION_EXPECTED_BOOLEAN,
  ERROR_VALIDATION_EXPECTED_NUMBER,
  ERROR_VALIDATION_EXPECTED_OBJECT,
  ERROR_VALIDATION_EXPECTED_ONE_OF_PREFIX,
  ERROR_VALIDATION_EXPECTED_STRING,
} from "./constants";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

/** A reusable validator function: unknown in, ValidationResult out. */
export type Validator<T> = (value: unknown) => ValidationResult<T>;

export function valid<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

export function invalid(message: string): ValidationResult<never> {
  return { ok: false, message };
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateString(value: unknown): ValidationResult<string> {
  if (!isString(value)) return invalid(ERROR_VALIDATION_EXPECTED_STRING);
  return valid(value);
}

export function validateNumber(value: unknown): ValidationResult<number> {
  if (!isNumber(value)) return invalid(ERROR_VALIDATION_EXPECTED_NUMBER);
  return valid(value);
}

export function validateRecord(value: unknown): ValidationResult<Record<string, unknown>> {
  if (!isRecord(value)) return invalid(ERROR_VALIDATION_EXPECTED_OBJECT);
  return valid(value);
}

export function validateBoolean(value: unknown): ValidationResult<boolean> {
  if (typeof value !== "boolean") return invalid(ERROR_VALIDATION_EXPECTED_BOOLEAN);
  return valid(value);
}

/**
 * Validates that value is an array; with an element validator, every element
 * is validated and the first failure reports its index. (The README used to
 * list validateArray under "What we don't provide".)
 */
export function validateArray<T = unknown>(
  value: unknown,
  element?: Validator<T>,
): ValidationResult<T[]> {
  if (!Array.isArray(value)) return invalid(ERROR_VALIDATION_EXPECTED_ARRAY);
  if (!element) return valid(value as T[]);
  const out: T[] = new Array(value.length);
  for (let i = 0; i < value.length; i++) {
    const r = element(value[i]);
    if (!r.ok) {
      return invalid(`${ERROR_VALIDATION_ELEMENT_AT_INDEX_PREFIX}${i}: ${r.message}`);
    }
    out[i] = r.value;
  }
  return valid(out);
}

/**
 * Validates membership in an allowed list. Pass the list `as const` to get a
 * narrowed literal-union result type:
 * validateEnum(x, ["draft", "live"] as const) -> ValidationResult<"draft" | "live">.
 */
export function validateEnum<T extends string | number>(
  value: unknown,
  allowed: readonly T[],
): ValidationResult<T> {
  for (const a of allowed) {
    if (a === value) return valid(value as T);
  }
  return invalid(`${ERROR_VALIDATION_EXPECTED_ONE_OF_PREFIX}${allowed.join(", ")}`);
}

/** Transforms the value inside an ok result; failures pass through unchanged. */
export function mapResult<T, U>(
  result: ValidationResult<T>,
  fn: (value: T) => U,
): ValidationResult<U> {
  return result.ok ? valid(fn(result.value)) : result;
}

/** Chains a second validation onto an ok result; failures short-circuit. */
export function andThenResult<T, U>(
  result: ValidationResult<T>,
  fn: (value: T) => ValidationResult<U>,
): ValidationResult<U> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Wraps a validator with an extra predicate — the composition helper the
 * README used to punt to Zod's .refine():
 * const validatePort = refine(validateNumber, (n) => n > 0 && n < 65536, "Expected port");
 */
export function refine<T>(
  validator: Validator<T>,
  predicate: (value: T) => boolean,
  message: string,
): Validator<T> {
  return (value: unknown) => {
    const r = validator(value);
    if (!r.ok) return r;
    return predicate(r.value) ? r : invalid(message);
  };
}
