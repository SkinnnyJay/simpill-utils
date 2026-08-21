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
 * Doubly linked list. O(1) insert/remove at head/tail; O(n/2) by index
 * (walks from whichever end is closer). Iteration is lazy (no full-array copy);
 * do not mutate the list while iterating.
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

  *[Symbol.iterator](): IterableIterator<T> {
    let node = this._head;
    while (node) {
      yield node.value;
      node = node.next;
    }
  }

  /** Lazy reverse iteration, tail to head. */
  *reversed(): IterableIterator<T> {
    let node = this._tail;
    while (node) {
      yield node.value;
      node = node.prev;
    }
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
    const node = this._tail;
    this._tail = node.prev;
    if (this._tail) this._tail.next = null;
    else this._head = null;
    node.prev = null;
    this._size--;
    return node.value;
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
    const node = this._head;
    this._head = node.next;
    if (this._head) this._head.prev = null;
    else this._tail = null;
    node.next = null;
    this._size--;
    return node.value;
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

  /**
   * Remove the element at index. Out-of-range indices return undefined.
   * (Previously removeAt(-1) removed the head and removeAt(size + n) removed
   * the tail — silent data loss on bad indices.)
   */
  removeAt(index: number): T | undefined {
    if (index < VALUE_0 || index >= this._size) return undefined;
    if (index === VALUE_0) return this.shift();
    if (index === this._size - 1) return this.pop();
    const node = this.getNodeAt(index);
    if (!node) return undefined;
    const prev = node.prev;
    const next = node.next;
    if (prev) prev.next = next;
    if (next) next.prev = prev;
    node.prev = null;
    node.next = null;
    this._size--;
    return node.value;
  }

  at(index: number): T | undefined {
    return this.get(index);
  }

  private getNodeAt(index: number): Node<T> | null {
    if (index < VALUE_0 || index >= this._size) return null;
    // Walk from the closer end.
    if (index <= this._size >> 1) {
      let node = this._head;
      for (let i = 0; i < index && node; i++) node = node.next;
      return node;
    }
    let node = this._tail;
    for (let i = this._size - 1; i > index && node; i--) node = node.prev;
    return node;
  }

  static fromArray<T>(arr: T[]): LinkedList<T> {
    const list = new LinkedList<T>();
    for (const v of arr) list.push(v);
    return list;
  }
}
