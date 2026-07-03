/**
 * Annotation/metadata utilities: attach and read metadata on objects.
 * Uses a WeakMap so keys don't hold references.
 *
 * Read paths (get/has/getAnnotations/delete) are allocation-free: previously
 * every read on an un-annotated target CREATED an empty Map and inserted it
 * into the WeakMap (reads had write side-effects and churned memory). Only
 * setAnnotation allocates now, and the per-target Map is released once its
 * last annotation is deleted.
 */

const METADATA = new WeakMap<object, Map<string, unknown>>();

export function setAnnotation<T>(target: object, key: string, value: T): void {
  let map = METADATA.get(target);
  if (!map) {
    map = new Map();
    METADATA.set(target, map);
  }
  map.set(key, value);
}

export function getAnnotation<T>(target: object, key: string): T | undefined {
  return METADATA.get(target)?.get(key) as T | undefined;
}

export function hasAnnotation(target: object, key: string): boolean {
  return METADATA.get(target)?.has(key) ?? false;
}

export function deleteAnnotation(target: object, key: string): boolean {
  const map = METADATA.get(target);
  if (!map) return false;
  const deleted = map.delete(key);
  if (deleted && map.size === 0) METADATA.delete(target);
  return deleted;
}

export function getAnnotations(target: object): Record<string, unknown> {
  const map = METADATA.get(target);
  return map ? Object.fromEntries(map) : {};
}
