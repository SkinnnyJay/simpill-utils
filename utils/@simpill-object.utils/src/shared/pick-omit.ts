/**
 * Type-safe pick and omit helpers. Preserve types and support array of keys.
 */

/**
 * Returns a new object with only the specified keys from obj. Keys missing on obj are omitted.
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      (result as Record<string, unknown>)[key as string] = obj[key];
    }
  }
  return result;
}

/**
 * Returns a new object with all keys from obj except the specified ones.
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const set = new Set(keys as unknown as (keyof T)[]);
  const result = {} as Omit<T, K>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!set.has(key)) {
      (result as Record<string, unknown>)[key as string] = obj[key];
    }
  }
  return result;
}

/**
 * Picks multiple keys with a single key (convenience for one key).
 */
export function pickOne<T extends object, K extends keyof T>(obj: T, key: K): Pick<T, K> {
  return pick(obj, [key]);
}
