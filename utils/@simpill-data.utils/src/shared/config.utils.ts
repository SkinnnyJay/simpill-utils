/** Layered config, env overlay, required keys. */
import { getByPath } from "@simpill/object.utils";
import { ERROR_CONFIG_MISSING_KEY_PREFIX } from "./constants";
import { deepClone } from "./data.utils";
import { isForbiddenKey, safeAssign } from "./internal.safety";

export type ConfigLayer = Record<string, unknown>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function mergeConfigLayers(layers: ConfigLayer[]): ConfigLayer {
  let out: ConfigLayer = {};
  for (const layer of layers) {
    out = deepMergeLayer(out, layer);
  }
  return out;
}

function deepMergeLayer(target: ConfigLayer, source: ConfigLayer): ConfigLayer {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    // Guard the deep-merge prototype-pollution class (lodash.merge CVE-2018-16487,
    // deepmerge-ts CVE-2022-24802): own __proto__/constructor/prototype keys from
    // JSON-parsed config files never flow into the merged output.
    if (isForbiddenKey(key)) {
      continue;
    }
    const s = source[key];
    const t = result[key];
    if (isPlainRecord(s) && isPlainRecord(t)) {
      result[key] = deepMergeLayer(t, s);
    } else if (s !== null && typeof s === "object") {
      // Deep-clone source-only branches: the original copied them by reference, so
      // mutating the merged config mutated the original layer object.
      safeAssign(result, key, deepClone(s));
    } else {
      safeAssign(result, key, s);
    }
  }
  return result;
}

/**
 * Throws if any required key is missing or undefined. Keys may be dotted
 * paths into nested config ("db.host") — the original only checked top-level
 * membership, so nested output from configFromEnv could never be validated.
 * A literal top-level key containing a dot still passes as before.
 */
export function requireKeys<T extends ConfigLayer>(config: T, keys: string[]): T {
  for (const k of keys) {
    if (k in config && config[k] !== undefined) {
      continue;
    }
    if (k.includes(".") && getByPath(config as Record<string, unknown>, k) !== undefined) {
      continue;
    }
    throw new Error(ERROR_CONFIG_MISSING_KEY_PREFIX + k);
  }
  return config;
}

export interface ConfigFromEnvOptions {
  /**
   * Which underscore sequence marks a nesting level. Default "_" (backward
   * compatible): APP_DB_HOST -> { db: { host } }, but every multi-word key
   * explodes too (APP_API_KEY -> { api: { key } }). Set "__" — the
   * cross-platform nesting convention used by .NET configuration and nconf —
   * so single underscores stay part of the key: APP_API_KEY -> { api_key },
   * APP_DB__HOST -> { db: { host } }.
   */
  nestingSeparator?: "_" | "__";
  /** Casing applied to derived key segments (default "lower"). */
  keyCase?: "lower" | "preserve";
}

export function configFromEnv(
  env: Record<string, string | undefined>,
  prefix: string,
  options: ConfigFromEnvOptions = {},
): ConfigLayer {
  const { nestingSeparator = "_", keyCase = "lower" } = options;
  const out: ConfigLayer = {};
  const p = prefix.endsWith("_") ? prefix : `${prefix}_`;
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || !key.startsWith(p)) {
      continue;
    }
    let rest = key.slice(p.length);
    if (keyCase === "lower") {
      rest = rest.toLowerCase();
    }
    const segments = rest.split(nestingSeparator);
    // Empty segments (doubled separators) and prototype-key segments are skipped
    // entirely rather than creating hostile nesting.
    if (segments.some((s) => s.length === 0 || isForbiddenKey(s))) {
      continue;
    }
    setNested(out, segments, value);
  }
  return out;
}

function setNested(out: ConfigLayer, segments: string[], value: unknown): void {
  let node: Record<string, unknown> = out;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const next = node[seg];
    if (next !== null && typeof next === "object" && !Array.isArray(next)) {
      node = next as Record<string, unknown>;
    } else {
      const created: Record<string, unknown> = {};
      safeAssign(node, seg, created);
      node = created;
    }
  }
  safeAssign(node, segments[segments.length - 1], value);
}
