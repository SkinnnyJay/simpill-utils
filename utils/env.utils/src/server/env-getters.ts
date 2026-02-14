/**
 * Pure getter logic for env values. Used by EnvManager to avoid a single huge class file.
 */

import { ENV_ERROR_MESSAGE, ENV_PARSE_TYPE } from "../shared/constants";
import { EnvParseError, EnvValidationError, MissingEnvError } from "../shared/errors";
import {
  parseBooleanEnvValue,
  parseBooleanEnvValueStrict,
  parseEnvEnum,
  parseEnvEnumStrict,
  parseNumberEnvValue,
  parseNumberEnvValueStrict,
} from "../shared/parse-helpers";
import { ENCRYPTED_VALUE_PREFIX } from "../shared/constants";
import { EnvDecryptError } from "../shared/errors";
import { parseEncrypted } from "./env-encrypt";

const DEFAULT_ARRAY_SEPARATOR = ",";

export type GetValueFn = (key: string) => string | undefined;

export interface EnvGettersContext {
  getValue: GetValueFn;
  getRawValue: (key: string) => string | undefined;
  envCache: Map<string, string>;
  rawCache: Map<string, string>;
  privateKey: string | undefined;
}

export function getStringFromEnv(getValue: GetValueFn, key: string, defaultValue: string): string {
  return getValue(key) ?? defaultValue;
}

export function getRequiredStringFromEnv(getValue: GetValueFn, key: string, errorMessage?: string): string {
  const value = getValue(key);
  if (value === undefined) throw new MissingEnvError(key, errorMessage);
  return value;
}

export function getNumberFromEnv(
  getValue: GetValueFn,
  key: string,
  defaultValue: number,
): number {
  const raw = getValue(key);
  if (raw === undefined) return defaultValue;
  return parseNumberEnvValue(raw, defaultValue);
}

export function getRequiredNumberFromEnv(
  getValue: GetValueFn,
  key: string,
  errorMessage?: string,
): number {
  const raw = getValue(key);
  if (raw === undefined) throw new MissingEnvError(key, errorMessage);
  return parseNumberEnvValueStrict(key, raw);
}

export function getBooleanFromEnv(
  getValue: GetValueFn,
  key: string,
  defaultValue: boolean,
): boolean {
  const raw = getValue(key);
  if (raw === undefined) return defaultValue;
  return parseBooleanEnvValue(raw, defaultValue);
}

export function getRequiredBooleanFromEnv(
  getValue: GetValueFn,
  key: string,
  errorMessage?: string,
): boolean {
  const raw = getValue(key);
  if (raw === undefined) throw new MissingEnvError(key, errorMessage);
  return parseBooleanEnvValueStrict(key, raw);
}

export function getEnumFromEnv<T extends string>(
  getValue: GetValueFn,
  key: string,
  allowed: readonly T[],
  defaultValue: T,
  options?: { caseInsensitive?: boolean },
): T {
  return parseEnvEnum(getValue(key) ?? "", allowed, defaultValue, options);
}

export function getRequiredEnumFromEnv<T extends string>(
  getValue: GetValueFn,
  key: string,
  allowed: readonly T[],
  options?: { caseInsensitive?: boolean },
): T {
  const raw = getValue(key);
  if (raw === undefined) throw new MissingEnvError(key);
  return parseEnvEnumStrict(key, raw, allowed, options);
}

export function getArrayFromEnv(
  getValue: GetValueFn,
  key: string,
  defaultValue: string[] = [],
  separator: string = DEFAULT_ARRAY_SEPARATOR,
): string[] {
  const raw = getValue(key);
  if (raw === undefined || raw === "") return defaultValue;
  return raw
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

export function getJsonFromEnv<T = unknown>(getValue: GetValueFn, key: string, defaultValue?: T): T {
  const raw = getValue(key);
  if (raw === undefined || raw === "") {
    if (defaultValue !== undefined) return defaultValue;
    return undefined as T;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    if (defaultValue !== undefined) return defaultValue;
    throw new EnvParseError(key, raw, ENV_PARSE_TYPE.JSON);
  }
}

export function getRequiredJsonFromEnv<T = unknown>(
  getValue: GetValueFn,
  key: string,
  errorMessage?: string,
): T {
  const raw = getValue(key);
  if (raw === undefined || raw === "") throw new MissingEnvError(key, errorMessage);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new EnvParseError(key, raw, ENV_PARSE_TYPE.JSON);
  }
}

export function getValidatedStringFromEnv(
  getValue: GetValueFn,
  getString: (k: string, d: string) => string,
  key: string,
  validator: (value: string) => boolean | string,
  defaultValue: string,
): string {
  const value = getString(key, defaultValue);
  const result = validator(value);
  if (result === true) return value;
  const reason = typeof result === "string" ? result : ENV_ERROR_MESSAGE.VALIDATION_FAILED;
  throw new EnvValidationError(key, value, reason);
}

export function getValidatedNumberFromEnv(
  getNumber: (k: string, d: number) => number,
  key: string,
  validator: (value: number) => boolean | string,
  defaultValue: number,
): number {
  const value = getNumber(key, defaultValue);
  const result = validator(value);
  if (result === true) return value;
  const reason = typeof result === "string" ? result : ENV_ERROR_MESSAGE.VALIDATION_FAILED;
  throw new EnvValidationError(key, String(value), reason);
}

export function isEncryptedFromEnv(rawCache: Map<string, string>, key: string): boolean {
  const raw = rawCache.get(key);
  return raw !== undefined && raw.startsWith(ENCRYPTED_VALUE_PREFIX);
}

export function getDecryptedFromEnv(ctx: EnvGettersContext, key: string, privateKey?: string): string {
  const raw = ctx.rawCache.get(key);
  if (raw === undefined) throw new MissingEnvError(key);
  if (!raw.startsWith(ENCRYPTED_VALUE_PREFIX)) {
    return ctx.envCache.get(key) ?? raw;
  }
  const keyToUse = privateKey ?? ctx.privateKey;
  if (!keyToUse) throw new EnvDecryptError(key, ENV_ERROR_MESSAGE.NO_PRIVATE_KEY);
  return parseEncrypted(raw, keyToUse);
}
