/**
 * Internal: prototype-pollution guards shared across data.utils modules.
 * Not exported from any barrel.
 */

/** Keys that must never create nesting or flow through dynamic assignment into merged output. */
const FORBIDDEN_PROTO_KEYS: ReadonlySet<string> = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

export function isForbiddenKey(key: string): boolean {
  return FORBIDDEN_PROTO_KEYS.has(key);
}

/**
 * Assign obj[key] = value without triggering the `__proto__` setter.
 * An own "__proto__" key (e.g. produced by JSON.parse) becomes a real own
 * data property instead of silently replacing the object's prototype.
 */
export function safeAssign(obj: Record<string, unknown>, key: string, value: unknown): void {
  if (key === "__proto__") {
    Object.defineProperty(obj, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  } else {
    obj[key] = value;
  }
}
