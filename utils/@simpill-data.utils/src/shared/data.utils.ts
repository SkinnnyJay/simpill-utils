/**
 * Generic data helpers: clone, pick/omit, ensure object shape.
 */

function isIndexable(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }
  if (!isIndexable(value)) return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    out[key] = deepClone(value[key]);
  }
  return out as T;
}

export function pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const k of keys) {
    if (k in obj) result[k] = obj[k];
  }
  return result;
}

function setProp(obj: Record<string, unknown>, key: string, value: unknown): void {
  obj[key] = value;
}

export function omitKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const set = new Set(keys);
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!set.has(key as K)) setProp(result, String(key), obj[key]);
  }
  return result as Omit<T, K>;
}

export function ensureKeys<T extends object>(obj: T, keys: (keyof T)[]): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const k of keys) {
    if (!(k in result)) setProp(result, String(k), undefined);
  }
  return result as T;
}
