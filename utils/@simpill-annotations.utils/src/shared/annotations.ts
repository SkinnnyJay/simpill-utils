/**
 * Per-target annotations: attach metadata TO objects (classes, functions,
 * instances) keyed by (target, key). WeakMap-backed so annotations are
 * garbage-collected with their targets — no leaks, no global key collisions.
 *
 * Reads are allocation-free: looking up an un-annotated target never
 * allocates or inserts a per-target Map, and deleting the last annotation
 * releases the target's map so the WeakMap entry can be collected.
 */
import type { MetadataKey, TypedMetadataKey } from "./metadata-store";

type AnyMetadataKey = MetadataKey | TypedMetadataKey<unknown>;
type TargetMap = WeakMap<object, Map<MetadataKey, unknown>>;

export interface AnnotationStore {
  setAnnotation<T>(target: object, key: TypedMetadataKey<T>, value: T): void;
  setAnnotation<T>(target: object, key: MetadataKey, value: T): void;
  getAnnotation<T>(target: object, key: TypedMetadataKey<T>): T | undefined;
  getAnnotation<T>(target: object, key: MetadataKey): T | undefined;
  /** Own-or-inherited read: walks the prototype chain (subclasses see base-class annotations). */
  getInheritedAnnotation<T>(target: object, key: TypedMetadataKey<T>): T | undefined;
  getInheritedAnnotation<T>(target: object, key: MetadataKey): T | undefined;
  hasAnnotation(target: object, key: AnyMetadataKey): boolean;
  hasInheritedAnnotation(target: object, key: AnyMetadataKey): boolean;
  deleteAnnotation(target: object, key: AnyMetadataKey): boolean;
  /** Own annotation keys for target (empty array if none). */
  getAnnotationKeys(target: object): MetadataKey[];
  /** Own annotations for target as a plain record (symbol and string keys). */
  getAnnotations(target: object): Record<string | symbol, unknown>;
  /** Removes all annotations from target. Returns true if any existed. */
  clearAnnotations(target: object): boolean;
}

function createAnnotationStoreOver(metadata: TargetMap): AnnotationStore {
  return {
    setAnnotation<T>(target: object, key: AnyMetadataKey, value: T): void {
      let map = metadata.get(target);
      if (map === undefined) {
        map = new Map();
        metadata.set(target, map);
      }
      map.set(key as MetadataKey, value);
    },
    getAnnotation<T>(target: object, key: AnyMetadataKey): T | undefined {
      // Allocation-free: never inserts a map on read.
      return metadata.get(target)?.get(key as MetadataKey) as T | undefined;
    },
    getInheritedAnnotation<T>(target: object, key: AnyMetadataKey): T | undefined {
      const k = key as MetadataKey;
      let current: object | null = target;
      while (current !== null) {
        const map = metadata.get(current);
        if (map?.has(k)) {
          return map.get(k) as T;
        }
        current = Object.getPrototypeOf(current) as object | null;
      }
      return undefined;
    },
    hasAnnotation(target: object, key: AnyMetadataKey): boolean {
      return metadata.get(target)?.has(key as MetadataKey) ?? false;
    },
    hasInheritedAnnotation(target: object, key: AnyMetadataKey): boolean {
      const k = key as MetadataKey;
      let current: object | null = target;
      while (current !== null) {
        if (metadata.get(current)?.has(k)) {
          return true;
        }
        current = Object.getPrototypeOf(current) as object | null;
      }
      return false;
    },
    deleteAnnotation(target: object, key: AnyMetadataKey): boolean {
      const map = metadata.get(target);
      if (map === undefined) {
        return false;
      }
      const deleted = map.delete(key as MetadataKey);
      if (deleted && map.size === 0) {
        // Release the empty per-target map so the WeakMap entry can be GC'd.
        metadata.delete(target);
      }
      return deleted;
    },
    getAnnotationKeys(target: object): MetadataKey[] {
      const map = metadata.get(target);
      return map === undefined ? [] : Array.from(map.keys());
    },
    getAnnotations(target: object): Record<string | symbol, unknown> {
      const map = metadata.get(target);
      const out: Record<string | symbol, unknown> = {};
      if (map !== undefined) {
        for (const [k, v] of map) {
          out[k] = v;
        }
      }
      return out;
    },
    clearAnnotations(target: object): boolean {
      return metadata.delete(target);
    },
  };
}

/** Creates an isolated annotation store (own WeakMap); use for scoped or test-isolated state. */
export function createAnnotationStore(): AnnotationStore {
  return createAnnotationStoreOver(new WeakMap());
}

/**
 * Shared default annotation backing, registered under Symbol.for() on
 * globalThis so duplicate package copies annotate/read the same state.
 */
const GLOBAL_ANNOTATIONS_KEY = Symbol.for("@simpill/annotations.utils:global-annotations");

const globalRegistry = globalThis as unknown as Record<symbol, unknown>;

function resolveGlobalTargetMap(): TargetMap {
  const existing = globalRegistry[GLOBAL_ANNOTATIONS_KEY] as TargetMap | undefined;
  if (existing !== undefined) {
    return existing;
  }
  const created: TargetMap = new WeakMap();
  globalRegistry[GLOBAL_ANNOTATIONS_KEY] = created;
  return created;
}

const globalTargetMap: TargetMap = resolveGlobalTargetMap();

const defaultStore = createAnnotationStoreOver(globalTargetMap);

/** Attaches an annotation to target under key (default shared store). */
export function setAnnotation<T>(target: object, key: TypedMetadataKey<T>, value: T): void;
export function setAnnotation<T>(target: object, key: MetadataKey, value: T): void;
export function setAnnotation<T>(target: object, key: AnyMetadataKey, value: T): void {
  defaultStore.setAnnotation(target, key as MetadataKey, value);
}

/** Reads target's own annotation under key (default shared store). */
export function getAnnotation<T>(target: object, key: TypedMetadataKey<T>): T | undefined;
export function getAnnotation<T>(target: object, key: MetadataKey): T | undefined;
export function getAnnotation<T>(target: object, key: AnyMetadataKey): T | undefined {
  return defaultStore.getAnnotation<T>(target, key as MetadataKey);
}

/** Own-or-inherited read: walks target's prototype chain (default shared store). */
export function getInheritedAnnotation<T>(target: object, key: TypedMetadataKey<T>): T | undefined;
export function getInheritedAnnotation<T>(target: object, key: MetadataKey): T | undefined;
export function getInheritedAnnotation<T>(target: object, key: AnyMetadataKey): T | undefined {
  return defaultStore.getInheritedAnnotation<T>(target, key as MetadataKey);
}

/** True if target has its own annotation under key (default shared store). */
export function hasAnnotation(target: object, key: AnyMetadataKey): boolean {
  return defaultStore.hasAnnotation(target, key);
}

/** True if target or any prototype has an annotation under key (default shared store). */
export function hasInheritedAnnotation(target: object, key: AnyMetadataKey): boolean {
  return defaultStore.hasInheritedAnnotation(target, key);
}

/** Removes target's own annotation under key; true if it existed (default shared store). */
export function deleteAnnotation(target: object, key: AnyMetadataKey): boolean {
  return defaultStore.deleteAnnotation(target, key);
}

/** Own annotation keys for target (default shared store). */
export function getAnnotationKeys(target: object): MetadataKey[] {
  return defaultStore.getAnnotationKeys(target);
}

/** Own annotations for target as a plain record (default shared store). */
export function getAnnotations(target: object): Record<string | symbol, unknown> {
  return defaultStore.getAnnotations(target);
}

/** Removes all annotations from target; true if any existed (default shared store). */
export function clearAnnotations(target: object): boolean {
  return defaultStore.clearAnnotations(target);
}
