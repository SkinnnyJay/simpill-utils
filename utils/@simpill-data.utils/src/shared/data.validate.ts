/**
 * Data validation helpers. No schema lib; simple predicates and results.
 */

import {
  ERROR_VALIDATION_EXPECTED_NUMBER,
  ERROR_VALIDATION_EXPECTED_OBJECT,
  ERROR_VALIDATION_EXPECTED_STRING,
} from "./constants";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

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
