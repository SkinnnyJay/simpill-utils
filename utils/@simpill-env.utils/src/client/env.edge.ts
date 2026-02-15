/**
 * Edge Runtime-compatible environment variable utilities.
 * For full .env file support, use server exports instead.
 */

import { NODE_ENV } from "../shared/constants";
import { parseBooleanEnvValue, parseNumberEnvValue } from "../shared/parse-helpers";

/**
 * Get an environment variable value or return a default.
 * Works in Edge Runtime by reading directly from process.env.
 * Type is inferred from the default value.
 */
export function getEdgeEnv(key: string, defaultValue: string): string;
export function getEdgeEnv(key: string, defaultValue: number): number;
export function getEdgeEnv(key: string, defaultValue: boolean): boolean;
export function getEdgeEnv(
  key: string,
  defaultValue: string | number | boolean
): string | number | boolean {
  const value: string | undefined = process.env[key];

  if (value === undefined) {
    return defaultValue;
  }

  if (typeof defaultValue === "number") {
    return parseNumberEnvValue(value, defaultValue);
  }

  if (typeof defaultValue === "boolean") {
    return parseBooleanEnvValue(value, defaultValue);
  }

  return value;
}

/**
 * Get a string environment variable with default (Edge Runtime).
 */
export function getEdgeString(key: string, defaultValue = ""): string {
  return getEdgeEnv(key, defaultValue);
}

/**
 * Get a number environment variable with default (Edge Runtime).
 */
export function getEdgeNumber(key: string, defaultValue = 0): number {
  return getEdgeEnv(key, defaultValue);
}

/**
 * Get a boolean environment variable with default (Edge Runtime).
 */
export function getEdgeBoolean(key: string, defaultValue = false): boolean {
  return getEdgeEnv(key, defaultValue);
}

/**
 * Check if an environment variable is set (Edge Runtime).
 */
export function hasEdgeEnv(key: string): boolean {
  return process.env[key] !== undefined;
}

/**
 * Check if running in production (Edge Runtime).
 */
export function isEdgeProd(): boolean {
  return process.env.NODE_ENV === NODE_ENV.PRODUCTION;
}

/**
 * Check if running in development (Edge Runtime).
 */
export function isEdgeDev(): boolean {
  return process.env.NODE_ENV === NODE_ENV.DEVELOPMENT;
}
