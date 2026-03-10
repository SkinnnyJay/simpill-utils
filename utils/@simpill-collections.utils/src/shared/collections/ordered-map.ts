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
    const key = this._order[index];
    if (key === undefined) return undefined;
    const value = this._map.get(key);
    return value !== undefined ? [key, value] : undefined;
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
        const v = map.get(k);
        if (v !== undefined) yield v;
      }
    })(this._order, this._map);
  }

  entries(): IterableIterator<[K, V]> {
    return (function* (order: K[], map: Map<K, V>) {
      for (const k of order) {
        const v = map.get(k);
        if (v !== undefined) yield [k, v];
      }
    })(this._order, this._map);
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
