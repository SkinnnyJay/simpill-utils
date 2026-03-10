import { VALUE_0 } from "../constants";

/**
 * MultiMap: one key maps to multiple values (array per key).
 */
export class MultiMap<K, V> {
  private readonly _map = new Map<K, V[]>();

  get size(): number {
    return this._map.size;
  }

  get(key: K): V[] {
    return this._map.get(key)?.slice() ?? [];
  }

  add(key: K, value: V): void {
    let arr = this._map.get(key);
    if (!arr) {
      arr = [];
      this._map.set(key, arr);
    }
    arr.push(value);
  }

  set(key: K, values: V[]): void {
    if (values.length === VALUE_0) {
      this._map.delete(key);
    } else {
      this._map.set(key, [...values]);
    }
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  hasEntry(key: K, value: V): boolean {
    const arr = this._map.get(key);
    return arr ? arr.includes(value) : false;
  }

  delete(key: K): boolean {
    return this._map.delete(key);
  }

  deleteEntry(key: K, value: V): boolean {
    const arr = this._map.get(key);
    if (!arr) return false;
    const i = arr.indexOf(value);
    if (i === -1) return false;
    arr.splice(i, 1);
    if (arr.length === VALUE_0) this._map.delete(key);
    return true;
  }

  clear(): void {
    this._map.clear();
  }

  keys(): IterableIterator<K> {
    return this._map.keys();
  }

  values(): IterableIterator<V[]> {
    return this._map.values();
  }

  entries(): IterableIterator<[K, V[]]> {
    return this._map.entries();
  }

  [Symbol.iterator](): IterableIterator<[K, V[]]> {
    return this._map.entries();
  }
}
