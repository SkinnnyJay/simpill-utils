/** Deep default, merge arrays, set nested path; getByPath/setByPath from @simpill/object.utils. */

import {
  getByPath as getByPathObj,
  isPlainObject,
  setByPath as setByPathObj,
} from "@simpill/object.utils";

function deepDefaultsRecord(
  target: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...target };
  for (const key of Object.keys(defaults)) {
    const d = defaults[key];
    if (d === undefined) continue;
    const t = out[key];
    if (t === undefined) {
      out[key] = d;
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
