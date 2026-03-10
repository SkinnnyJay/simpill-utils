import { VALUE_0 } from "../constants";
import type { ICollection } from "../contracts";

class Node<T> {
  value: T;
  next: Node<T> | null = null;
  prev: Node<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

/**
 * Doubly linked list. O(1) insert/remove at head/tail; O(n) by index.
 */
export class LinkedList<T> implements ICollection<T> {
  private _head: Node<T> | null = null;
  private _tail: Node<T> | null = null;
  private _size = VALUE_0;

  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === VALUE_0;
  }

  clear(): void {
    this._head = null;
    this._tail = null;
    this._size = VALUE_0;
  }

  toArray(): T[] {
    const out: T[] = [];
    let node = this._head;
    while (node) {
      out.push(node.value);
      node = node.next;
    }
    return out;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.toArray()[Symbol.iterator]();
  }

  push(value: T): void {
    const node = new Node(value);
    if (!this._tail) {
      this._head = this._tail = node;
    } else {
      this._tail.next = node;
      node.prev = this._tail;
      this._tail = node;
    }
    this._size++;
  }

  pop(): T | undefined {
    if (!this._tail) return undefined;
    const value = this._tail.value;
    this._tail = this._tail.prev;
    if (this._tail) this._tail.next = null;
    else this._head = null;
    this._size--;
    return value;
  }

  unshift(value: T): void {
    const node = new Node(value);
    if (!this._head) {
      this._head = this._tail = node;
    } else {
      node.next = this._head;
      this._head.prev = node;
      this._head = node;
    }
    this._size++;
  }

  shift(): T | undefined {
    if (!this._head) return undefined;
    const value = this._head.value;
    this._head = this._head.next;
    if (this._head) this._head.prev = null;
    else this._tail = null;
    this._size--;
    return value;
  }

  get(index: number): T | undefined {
    const node = this.getNodeAt(index);
    return node ? node.value : undefined;
  }

  set(index: number, value: T): void {
    const node = this.getNodeAt(index);
    if (node) node.value = value;
  }

  insertAt(index: number, value: T): void {
    if (index <= VALUE_0) {
      this.unshift(value);
      return;
    }
    if (index >= this._size) {
      this.push(value);
      return;
    }
    const next = this.getNodeAt(index);
    if (!next) return;
    const node = new Node(value);
    const prev = next.prev;
    node.prev = prev;
    node.next = next;
    if (prev) prev.next = node;
    next.prev = node;
    this._size++;
  }

  removeAt(index: number): T | undefined {
    if (index <= VALUE_0) return this.shift();
    if (index >= this._size - 1) return this.pop();
    const node = this.getNodeAt(index);
    if (!node) return undefined;
    const prev = node.prev;
    const next = node.next;
    if (prev) prev.next = next;
    if (next) next.prev = prev;
    this._size--;
    return node.value;
  }

  at(index: number): T | undefined {
    return this.get(index);
  }

  private getNodeAt(index: number): Node<T> | null {
    if (index < VALUE_0 || index >= this._size) return null;
    let node = this._head;
    for (let i = 0; i < index && node; i++) node = node.next;
    return node;
  }

  static fromArray<T>(arr: T[]): LinkedList<T> {
    const list = new LinkedList<T>();
    for (const v of arr) list.push(v);
    return list;
  }
}
