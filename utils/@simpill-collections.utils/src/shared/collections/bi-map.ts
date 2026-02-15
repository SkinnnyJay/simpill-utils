/**
 * BiMap: bidirectional map. Key and value must both be unique.
 */
export interface BiMapOptions<K, V> {
  equalsKey?: (a: K, b: K) => boolean;
  equalsValue?: (a: V, b: V) => boolean;
  hashKey?: (k: K) => string;
  hashValue?: (v: V) => string;
}

const defaultHash = (x: unknown): string =>
  typeof x === "object" && x !== null ? JSON.stringify(x) : String(x);

export class BiMap<K, V> {
  private readonly _keyToValue = new Map<string, { k: K; v: V }>();
  private readonly _valueToKey = new Map<string, { k: K; v: V }>();
  private readonly _hashKey: (k: K) => string;
  private readonly _hashValue: (v: V) => string;

  constructor(options: BiMapOptions<K, V> = {}) {
    this._hashKey = options.hashKey ?? ((k) => defaultHash(k));
    this._hashValue = options.hashValue ?? ((v) => defaultHash(v));
  }

  get size(): number {
    return this._keyToValue.size;
  }

  set(key: K, value: V): void {
    const hk = this._hashKey(key);
    const hv = this._hashValue(value);
    const existingByKey = this._keyToValue.get(hk);
    const existingByValue = this._valueToKey.get(hv);
    if (existingByKey) {
      this._valueToKey.delete(this._hashValue(existingByKey.v));
    }
    if (existingByValue) {
      this._keyToValue.delete(this._hashKey(existingByValue.k));
    }
    const entry = { k: key, v: value };
    this._keyToValue.set(hk, entry);
    this._valueToKey.set(hv, entry);
  }

  getByKey(key: K): V | undefined {
    return this._keyToValue.get(this._hashKey(key))?.v;
  }

  getByValue(value: V): K | undefined {
    return this._valueToKey.get(this._hashValue(value))?.k;
  }

  hasKey(key: K): boolean {
    return this._keyToValue.has(this._hashKey(key));
  }

  hasValue(value: V): boolean {
    return this._valueToKey.has(this._hashValue(value));
  }

  deleteByKey(key: K): boolean {
    const entry = this._keyToValue.get(this._hashKey(key));
    if (!entry) return false;
    this._keyToValue.delete(this._hashKey(key));
    this._valueToKey.delete(this._hashValue(entry.v));
    return true;
  }

  deleteByValue(value: V): boolean {
    const entry = this._valueToKey.get(this._hashValue(value));
    if (!entry) return false;
    this._valueToKey.delete(this._hashValue(value));
    this._keyToValue.delete(this._hashKey(entry.k));
    return true;
  }

  clear(): void {
    this._keyToValue.clear();
    this._valueToKey.clear();
  }

  keys(): IterableIterator<K> {
    return (function* (map: Map<string, { k: K; v: V }>) {
      for (const { k } of map.values()) yield k;
    })(this._keyToValue);
  }

  values(): IterableIterator<V> {
    return (function* (map: Map<string, { k: K; v: V }>) {
      for (const { v } of map.values()) yield v;
    })(this._keyToValue);
  }
}
