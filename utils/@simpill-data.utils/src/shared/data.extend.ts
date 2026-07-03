/** Deep default, merge arrays, set nested path; getByPath/setByPath from @simpill/object.utils. */

import {
  getByPath as getByPathObj,
  isPlainObject,
  setByPath as setByPathObj,
} from "@simpill/object.utils";
import { deepClone } from "./data.utils";
import { isForbiddenKey, safeAssign } from "./internal.safety";

function deepDefaultsRecord(
  target: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...target };
  for (const key of Object.keys(defaults)) {
    // JSON.parse('{"__proto__":{...}}') produces an own "__proto__" key; assigning it
    // through out[key] replaces the result's prototype and injects attacker-controlled
    // inherited properties (the lodash.merge / deepmerge CVE class). Skip at every depth.
    if (isForbiddenKey(key)) {
      continue;
    }
    const d = defaults[key];
    if (d === undefined) {
      continue;
    }
    const t = out[key];
    if (t === undefined) {
      // Deep-clone defaults-only branches: the original copied them by reference,
      // so mutating the result mutated the shared defaults object.
      safeAssign(out, key, d !== null && typeof d === "object" ? deepClone(d) : d);
      continue;
    }
    if (isPlainObject(t) && isPlainObject(d)) {
      out[key] = deepDefaultsRecord(t, d);
    }
  }
  return out;
}

/** Casts at API boundary: bridge generic T with internal Record<string, unknown> implementation. */
export function deepDefaults<T extends object>(target: T, defaults: Partial<T>): T {
  const result = deepDefaultsRecord(
    { ...target } as Record<string, unknown>,
    defaults as Record<string, unknown>,
  );
  return result as T;
}

/** Re-export from @simpill/object.utils. Mutates obj and returns it. */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  setByPathObj(obj, path, value);
}

/** Re-export from @simpill/object.utils. */
export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return getByPathObj(obj, path);
}
