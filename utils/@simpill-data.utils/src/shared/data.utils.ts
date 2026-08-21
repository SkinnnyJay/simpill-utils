/**
 * Generic data helpers: clone, pick/omit, ensure object shape.
 */

import { safeAssign } from "./internal.safety";

function cloneSpecial(value: object): object {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (value instanceof RegExp) {
    const re = new RegExp(value.source, value.flags);
    re.lastIndex = value.lastIndex;
    return re;
  }
  if (ArrayBuffer.isView(value)) {
    if (value instanceof DataView) {
      return new DataView(value.buffer.slice(0), value.byteOffset, value.byteLength);
    }
    // TypedArray: slice() copies the underlying bytes.
    return (value as unknown as { slice(): object }).slice();
  }
  if (value instanceof ArrayBuffer) {
    return value.slice(0);
  }
  // Class instance: preserve the prototype; own enumerable keys are walked by the caller.
  return Object.create(Object.getPrototypeOf(value)) as object;
}

/**
 * Deep clone with an explicit work stack (no recursion — a 100k-deep tree
 * clones fine where the naive recursive version threw RangeError) and a
 * visited map, so circular references and shared sub-objects are preserved
 * in the clone instead of crashing or being duplicated.
 *
 * Supported beyond plain objects/arrays: Date, RegExp (flags + lastIndex),
 * Map (keys and values cloned), Set, ArrayBuffer, TypedArrays, DataView.
 * Class instances keep their prototype; functions and symbols are copied by
 * reference (unchanged from the original behavior).
 */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  const seen = new Map<object, object>();
  // Flat interleaved stack of [source, target, source, target, ...] pairs —
  // no per-frame tuple allocation.
  const stack: object[] = [];

  const cloneNode = (node: object): object => {
    const existing = seen.get(node);
    if (existing !== undefined) {
      return existing;
    }
    let shell: object;
    let walk = true;
    if (Array.isArray(node)) {
      shell = new Array(node.length);
    } else {
      const proto: object | null = Object.getPrototypeOf(node);
      if (proto === Object.prototype) {
        shell = {};
      } else if (proto === null) {
        shell = Object.create(null) as object;
      } else if (node instanceof Map) {
        shell = new Map();
      } else if (node instanceof Set) {
        shell = new Set();
      } else {
        shell = cloneSpecial(node);
        walk = !(
          node instanceof Date ||
          node instanceof RegExp ||
          node instanceof ArrayBuffer ||
          ArrayBuffer.isView(node)
        );
      }
    }
    seen.set(node, shell);
    if (walk) {
      stack.push(node, shell);
    }
    return shell;
  };

  const root = cloneNode(value as object);

  while (stack.length > 0) {
    const dst = stack.pop() as object;
    const src = stack.pop() as object;
    if (Array.isArray(src)) {
      const out = dst as unknown[];
      for (let i = 0; i < src.length; i++) {
        const v: unknown = src[i];
        out[i] = v === null || typeof v !== "object" ? v : cloneNode(v as object);
      }
    } else if (src instanceof Map) {
      const out = dst as Map<unknown, unknown>;
      for (const [k, v] of src) {
        out.set(
          k === null || typeof k !== "object" ? k : cloneNode(k as object),
          v === null || typeof v !== "object" ? v : cloneNode(v as object),
        );
      }
    } else if (src instanceof Set) {
      const out = dst as Set<unknown>;
      for (const v of src) {
        out.add(v === null || typeof v !== "object" ? v : cloneNode(v as object));
      }
    } else {
      const out = dst as Record<string, unknown>;
      const record = src as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        const v = record[key];
        const cloned = v === null || typeof v !== "object" ? v : cloneNode(v as object);
        if (key === "__proto__") {
          safeAssign(out, key, cloned);
        } else {
          out[key] = cloned;
        }
      }
    }
  }
  return root as T;
}

/**
 * Picks own enumerable keys only. The original used `k in obj`, which walked
 * the prototype chain — pickKeys({}, ["toString"]) picked Object.prototype
 * methods into the result.
 */
export function pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const k of keys) {
    if (Object.getOwnPropertyDescriptor(obj, k) === undefined) {
      continue;
    }
    if (typeof k === "string") {
      safeAssign(result as Record<string, unknown>, k, obj[k]);
    } else {
      (result as Record<PropertyKey, unknown>)[k as PropertyKey] = obj[k];
    }
  }
  return result;
}

export function omitKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const set = new Set(keys);
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!set.has(key as K)) {
      safeAssign(result, String(key), obj[key]);
    }
  }
  return result as Omit<T, K>;
}

export function ensureKeys<T extends object>(obj: T, keys: (keyof T)[]): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const k of keys) {
    if (!(k in result)) {
      safeAssign(result, String(k), undefined);
    }
  }
  return result as T;
}
