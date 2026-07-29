import { ERROR_MAX_SIZE_MUST_BE_POSITIVE, VALUE_0 } from "./constants";

/**
 * In-memory LRU Map with max size. Runtime-agnostic. Evicts least recently used on overflow.
 * Iteration order is least-recently-used first (eviction order).
 *
 * LRUMap uses Map insertion-order for O(n) access reordering (delete + re-insert on get).
 * For O(1) LRU with a doubly-linked list, use LRUCache (from @simpill/collections.utils,
 * re-exported from @simpill/cache.utils as LRUCache).
 *
 * @param maxSize - Maximum number of entries (must be a positive number; NaN rejected)
 * @throws Error if maxSize <= 0 or NaN
 */
export class LRUMap<K, V> {
  private map = new Map<K, V>();
  private readonly _maxSize: number;

  constructor(maxSize: number) {
    if (Number.isNaN(maxSize) || maxSize <= VALUE_0) {
      throw new Error(ERROR_MAX_SIZE_MUST_BE_POSITIVE);
    }
    this._maxSize = maxSize;
  }

  /** Maximum number of entries. */
  get maxSize(): number {
    return this._maxSize;
  }

  /** Set key to value; re-inserts if present, evicts LRU if at capacity. */
  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this._maxSize) {
      const first = this.map.keys().next();
      if (!first.done) this.map.delete(first.value);
    }
    this.map.set(key, value);
  }

  /** Get value for key; updates access order. Returns undefined if missing. Correctly refreshes recency for stored `undefined` values. */
  get(key: K): V | undefined {
    const v = this.map.get(key);
    // Only pay for has() when the value is ambiguous (stored undefined vs miss).
    if (v === undefined && !this.map.has(key)) return undefined;
    this.map.delete(key);
    this.map.set(key, v as V);
    return v;
  }

  /** Get value for key WITHOUT updating access order. Returns undefined if missing. */
  peek(key: K): V | undefined {
    return this.map.get(key);
  }

  /** True if key exists. */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /** Remove key. Returns true if it existed. */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /** Current number of entries. */
  get size(): number {
    return this.map.size;
  }

  /** Remove all entries. */
  clear(): void {
    this.map.clear();
  }

  /** Keys, least-recently-used first. */
  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  /** Values, least-recently-used first. */
  values(): IterableIterator<V> {
    return this.map.values();
  }

  /** [key, value] pairs, least-recently-used first. */
  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.map.entries();
  }
}
