/**
 * Annotation/metadata utilities: attach and read metadata on objects.
 * Uses a WeakMap so keys don't hold references.
 */

const METADATA = new WeakMap<object, Map<string, unknown>>();

function getMap(target: object): Map<string, unknown> {
  let map = METADATA.get(target);
  if (!map) {
    map = new Map();
    METADATA.set(target, map);
  }
  return map;
}

export function setAnnotation<T>(target: object, key: string, value: T): void {
  getMap(target).set(key, value);
}

export function getAnnotation<T>(target: object, key: string): T | undefined {
  return getMap(target).get(key) as T | undefined;
}

export function hasAnnotation(target: object, key: string): boolean {
  return getMap(target).has(key);
}

export function deleteAnnotation(target: object, key: string): boolean {
  return getMap(target).delete(key);
}

export function getAnnotations(target: object): Record<string, unknown> {
  return Object.fromEntries(getMap(target));
}
