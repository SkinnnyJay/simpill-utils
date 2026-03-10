import { ERROR_MAX_SIZE_MUST_BE_POSITIVE, VALUE_0 } from "./constants";

/**
 * In-memory LRU Map with max size. Runtime-agnostic. Evicts least recently used on overflow.
 * @param maxSize - Maximum number of entries (must be positive)
 * @throws Error if maxSize <= 0
 */
export class LRUMap<K, V> {
  private map = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    if (maxSize <= VALUE_0) throw new Error(ERROR_MAX_SIZE_MUST_BE_POSITIVE);
    this.maxSize = maxSize;
  }

  /** Set key to value; re-inserts if present, evicts LRU if at capacity. */
  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
    this.map.set(key, value);
  }

  /** Get value for key; updates access order. Returns undefined if missing. */
  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v !== undefined) {
      this.map.delete(key);
      this.map.set(key, v);
    }
    return v;
  }

  /** True if key exists. */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /** Current number of entries. */
  get size(): number {
    return this.map.size;
  }

  /** Remove all entries. */
  clear(): void {
    this.map.clear();
  }
}
