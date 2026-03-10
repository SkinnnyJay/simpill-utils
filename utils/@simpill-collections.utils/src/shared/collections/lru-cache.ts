import { ERROR_LRU_CACHE_MAX_SIZE, VALUE_1 } from "../constants";

/**
 * LRU cache: max size, evicts least recently used on set when full.
 */
export interface LRUCacheOptions {
  maxSize: number;
}

class LRUNode<K, V> {
  key: K;
  value: V;
  next: LRUNode<K, V> | null = null;
  prev: LRUNode<K, V> | null = null;
  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private readonly _maxSize: number;
  private readonly _map = new Map<K, LRUNode<K, V>>();
  private _head: LRUNode<K, V> | null = null;
  private _tail: LRUNode<K, V> | null = null;

  constructor(options: number | LRUCacheOptions) {
    this._maxSize = typeof options === "number" ? options : options.maxSize;
    if (this._maxSize < VALUE_1) throw new RangeError(ERROR_LRU_CACHE_MAX_SIZE);
  }

  get size(): number {
    return this._map.size;
  }

  get maxSize(): number {
    return this._maxSize;
  }

  get(key: K): V | undefined {
    const node = this._map.get(key);
    if (!node) return undefined;
    this.touch(node);
    return node.value;
  }

  set(key: K, value: V): void {
    let node = this._map.get(key);
    if (node) {
      node.value = value;
      this.touch(node);
      return;
    }
    node = new LRUNode(key, value);
    this._map.set(key, node);
    this.pushFront(node);
    while (this._map.size > this._maxSize && this._tail) {
      this._map.delete(this._tail.key);
      this.remove(this._tail);
    }
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  delete(key: K): boolean {
    const node = this._map.get(key);
    if (!node) return false;
    this._map.delete(key);
    this.remove(node);
    return true;
  }

  clear(): void {
    this._map.clear();
    this._head = null;
    this._tail = null;
  }

  private touch(node: LRUNode<K, V>): void {
    this.remove(node);
    this.pushFront(node);
  }

  private remove(node: LRUNode<K, V>): void {
    if (node.prev) node.prev.next = node.next;
    else this._head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this._tail = node.prev;
  }

  private pushFront(node: LRUNode<K, V>): void {
    node.prev = null;
    node.next = this._head;
    if (this._head) this._head.prev = node;
    else this._tail = node;
    this._head = node;
  }
}
