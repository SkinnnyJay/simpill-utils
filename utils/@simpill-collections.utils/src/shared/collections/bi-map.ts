/**
 * BiMap: bidirectional map. Key and value must both be unique.
 *
 * Storage strategy (fixes two bugs in the previous implementation):
 * 1. With NO options, entries are stored in native Maps (SameValueZero identity).
 *    Previously everything was stringified via String()/JSON.stringify, so
 *    distinct keys collided: set(1, "a") then set("1", "b") silently overwrote
 *    the first entry; all anonymous symbols collided; {a:1,b:2} vs {b:2,a:1}
 *    were treated as different while structurally-equal objects were merged.
 * 2. equalsKey/equalsValue were declared in BiMapOptions but never used.
 *    They now work: when provided (without hashes), lookups use a linear scan
 *    with the supplied equality (O(n) per op, documented).
 * When hashKey/hashValue are provided they define identity (O(1) per op);
 * a missing hash falls back to the legacy String()/JSON.stringify hash.
 */
export interface BiMapOptions<K, V> {
  equalsKey?: (a: K, b: K) => boolean;
  equalsValue?: (a: V, b: V) => boolean;
  hashKey?: (k: K) => string;
  hashValue?: (v: V) => string;
}

const defaultHash = (x: unknown): string =>
  typeof x === "object" && x !== null ? JSON.stringify(x) : String(x);

interface Pair<K, V> {
  k: K;
  v: V;
}

type Mode = "native" | "linear" | "hashed";

export class BiMap<K, V> {
  private readonly _mode: Mode;
  // native mode
  private readonly _k2v = new Map<K, V>();
  private readonly _v2k = new Map<V, K>();
  // linear mode
  private readonly _pairs: Pair<K, V>[] = [];
  private readonly _equalsKey: (a: K, b: K) => boolean;
  private readonly _equalsValue: (a: V, b: V) => boolean;
  // hashed mode
  private readonly _keyToValue = new Map<string, Pair<K, V>>();
  private readonly _valueToKey = new Map<string, Pair<K, V>>();
  private readonly _hashKey: (k: K) => string;
  private readonly _hashValue: (v: V) => string;

  constructor(options: BiMapOptions<K, V> = {}) {
    if (options.hashKey || options.hashValue) this._mode = "hashed";
    else if (options.equalsKey || options.equalsValue) this._mode = "linear";
    else this._mode = "native";
    this._equalsKey = options.equalsKey ?? ((a, b) => a === b);
    this._equalsValue = options.equalsValue ?? ((a, b) => a === b);
    this._hashKey = options.hashKey ?? ((k) => defaultHash(k));
    this._hashValue = options.hashValue ?? ((v) => defaultHash(v));
  }

  get size(): number {
    if (this._mode === "native") return this._k2v.size;
    if (this._mode === "linear") return this._pairs.length;
    return this._keyToValue.size;
  }

  set(key: K, value: V): void {
    if (this._mode === "native") {
      const oldValue = this._k2v.get(key);
      if (oldValue !== undefined || this._k2v.has(key)) this._v2k.delete(oldValue as V);
      const oldKey = this._v2k.get(value);
      if (oldKey !== undefined || this._v2k.has(value)) this._k2v.delete(oldKey as K);
      this._k2v.set(key, value);
      this._v2k.set(value, key);
      return;
    }
    if (this._mode === "linear") {
      const ki = this._pairs.findIndex((p) => this._equalsKey(p.k, key));
      if (ki !== -1) this._pairs.splice(ki, 1);
      const vi = this._pairs.findIndex((p) => this._equalsValue(p.v, value));
      if (vi !== -1) this._pairs.splice(vi, 1);
      this._pairs.push({ k: key, v: value });
      return;
    }
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
    if (this._mode === "native") return this._k2v.get(key);
    if (this._mode === "linear") return this._pairs.find((p) => this._equalsKey(p.k, key))?.v;
    return this._keyToValue.get(this._hashKey(key))?.v;
  }

  getByValue(value: V): K | undefined {
    if (this._mode === "native") return this._v2k.get(value);
    if (this._mode === "linear") return this._pairs.find((p) => this._equalsValue(p.v, value))?.k;
    return this._valueToKey.get(this._hashValue(value))?.k;
  }

  hasKey(key: K): boolean {
    if (this._mode === "native") return this._k2v.has(key);
    if (this._mode === "linear") return this._pairs.some((p) => this._equalsKey(p.k, key));
    return this._keyToValue.has(this._hashKey(key));
  }

  hasValue(value: V): boolean {
    if (this._mode === "native") return this._v2k.has(value);
    if (this._mode === "linear") return this._pairs.some((p) => this._equalsValue(p.v, value));
    return this._valueToKey.has(this._hashValue(value));
  }

  deleteByKey(key: K): boolean {
    if (this._mode === "native") {
      if (!this._k2v.has(key)) return false;
      this._v2k.delete(this._k2v.get(key) as V);
      this._k2v.delete(key);
      return true;
    }
    if (this._mode === "linear") {
      const i = this._pairs.findIndex((p) => this._equalsKey(p.k, key));
      if (i === -1) return false;
      this._pairs.splice(i, 1);
      return true;
    }
    const entry = this._keyToValue.get(this._hashKey(key));
    if (!entry) return false;
    this._keyToValue.delete(this._hashKey(key));
    this._valueToKey.delete(this._hashValue(entry.v));
    return true;
  }

  deleteByValue(value: V): boolean {
    if (this._mode === "native") {
      if (!this._v2k.has(value)) return false;
      this._k2v.delete(this._v2k.get(value) as K);
      this._v2k.delete(value);
      return true;
    }
    if (this._mode === "linear") {
      const i = this._pairs.findIndex((p) => this._equalsValue(p.v, value));
      if (i === -1) return false;
      this._pairs.splice(i, 1);
      return true;
    }
    const entry = this._valueToKey.get(this._hashValue(value));
    if (!entry) return false;
    this._valueToKey.delete(this._hashValue(value));
    this._keyToValue.delete(this._hashKey(entry.k));
    return true;
  }

  clear(): void {
    this._k2v.clear();
    this._v2k.clear();
    this._pairs.length = 0;
    this._keyToValue.clear();
    this._valueToKey.clear();
  }

  *keys(): IterableIterator<K> {
    for (const [k] of this.entries()) yield k;
  }

  *values(): IterableIterator<V> {
    for (const [, v] of this.entries()) yield v;
  }

  *entries(): IterableIterator<[K, V]> {
    if (this._mode === "native") {
      for (const [k, v] of this._k2v) yield [k, v];
    } else if (this._mode === "linear") {
      for (const { k, v } of this._pairs) yield [k, v];
    } else {
      for (const { k, v } of this._keyToValue.values()) yield [k, v];
    }
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
