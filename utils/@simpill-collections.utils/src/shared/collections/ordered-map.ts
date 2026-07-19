/**
 * OrderedMap: Map with insertion order; get/set by key and get by index.
 */
export class OrderedMap<K, V> {
  private readonly _order: K[] = [];
  private readonly _map = new Map<K, V>();

  get size(): number {
    return this._map.size;
  }

  get(key: K): V | undefined {
    return this._map.get(key);
  }

  set(key: K, value: V): void {
    if (!this._map.has(key)) this._order.push(key);
    this._map.set(key, value);
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  delete(key: K): boolean {
    const ok = this._map.delete(key);
    if (ok) {
      const i = this._order.indexOf(key);
      if (i !== -1) this._order.splice(i, 1);
    }
    return ok;
  }

  clear(): void {
    this._map.clear();
    this._order.length = 0;
  }

  getAt(index: number): [K, V] | undefined {
    // Bounds-checked so stored `undefined` keys/values are handled correctly
    // (previously any entry whose value was undefined was reported missing).
    if (index < 0 || index >= this._order.length) return undefined;
    const key = this._order[index] as K;
    if (!this._map.has(key)) return undefined;
    return [key, this._map.get(key) as V];
  }

  keyAt(index: number): K | undefined {
    return this._order[index];
  }

  valueAt(index: number): V | undefined {
    const key = this._order[index];
    return key !== undefined ? this._map.get(key) : undefined;
  }

  keys(): IterableIterator<K> {
    return this._order[Symbol.iterator]();
  }

  values(): IterableIterator<V> {
    return (function* (order: K[], map: Map<K, V>) {
      for (const k of order) {
        // Presence check, not value check: entries storing `undefined` were
        // silently skipped, making iteration disagree with size.
        if (map.has(k)) yield map.get(k) as V;
      }
    })(this._order, this._map);
  }

  entries(): IterableIterator<[K, V]> {
    return (function* (order: K[], map: Map<K, V>) {
      for (const k of order) {
        if (map.has(k)) yield [k, map.get(k) as V];
      }
    })(this._order, this._map);
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
