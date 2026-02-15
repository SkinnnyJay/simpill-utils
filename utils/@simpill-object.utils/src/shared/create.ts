/**
 * Helpers for defining objects with defaults and read-only properties.
 */

/**
 * Creates a new object with default values, then overlays provided partial.
 * Missing keys in partial get the default value. Does not mutate defaults.
 */
export function createWithDefaults<T extends object>(defaults: T, partial: Partial<T>): T {
  return { ...defaults, ...partial };
}

/**
 * Defines a non-enumerable, read-only property on the object. Returns obj.
 */
export function defineReadOnly<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
): T {
  Object.defineProperty(obj, key, {
    value,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  return obj;
}

/**
 * Creates an object from an array of [key, value] pairs. Duplicate keys use the last value.
 */
export function fromEntries<K extends string, V>(entries: Iterable<readonly [K, V]>): Record<K, V> {
  const result = {} as Record<K, V>;
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
}
