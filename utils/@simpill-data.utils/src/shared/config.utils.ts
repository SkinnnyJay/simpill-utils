/** Layered config, env overlay, required keys. */
import { setByPath } from "@simpill/object.utils";
import { ERROR_CONFIG_MISSING_KEY_PREFIX } from "./constants";

export type ConfigLayer = Record<string, unknown>;

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
    const s = source[key];
    const t = result[key];
    if (
      s !== null &&
      typeof s === "object" &&
      !Array.isArray(s) &&
      t !== null &&
      typeof t === "object" &&
      !Array.isArray(t)
    ) {
      result[key] = deepMergeLayer(t as ConfigLayer, s as ConfigLayer);
    } else {
      result[key] = s;
    }
  }
  return result;
}

export function requireKeys<T extends ConfigLayer>(config: T, keys: string[]): T {
  for (const k of keys) {
    if (!(k in config) || config[k] === undefined) {
      throw new Error(ERROR_CONFIG_MISSING_KEY_PREFIX + k);
    }
  }
  return config;
}

export function configFromEnv(
  env: Record<string, string | undefined>,
  prefix: string,
): ConfigLayer {
  const out: ConfigLayer = {};
  const p = prefix.endsWith("_") ? prefix : `${prefix}_`;
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || !key.startsWith(p)) continue;
    const sub = key.slice(p.length).toLowerCase().replace(/_/g, ".");
    setByPath(out, sub, value);
  }
  return out;
}
