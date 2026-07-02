/**
 * Internal O(1) FIFO (doubly-linked list). Replaces Array#shift-based queues,
 * which are O(n) per dequeue and degrade to O(n^2) under load. Also gives
 * O(1) removal of an arbitrary node (used by AbortSignal listeners), where
 * the array version needed indexOf + splice (O(n)).
 */
export interface FifoNode<T> {
  value: T;
  prev: FifoNode<T> | null;
  next: FifoNode<T> | null;
  /** Set when the node has been unlinked (guards double-removal). */
  detached: boolean;
}

export class Fifo<T> {
  private head: FifoNode<T> | null = null;
  private tail: FifoNode<T> | null = null;
  private count = 0;

  get size(): number {
    return this.count;
  }

  /** Append a value; returns its node for O(1) removal later. */
  push(value: T): FifoNode<T> {
    const node: FifoNode<T> = { value, prev: this.tail, next: null, detached: false };
    if (this.tail) {
      this.tail.next = node;
    } else {
      this.head = node;
    }
    this.tail = node;
    this.count++;
    return node;
  }

  /** Remove and return the oldest value, or undefined when empty. */
  shift(): T | undefined {
    const node = this.head;
    if (!node) return undefined;
    this.remove(node);
    return node.value;
  }

  /** Unlink a node in O(1). Safe to call more than once. */
  remove(node: FifoNode<T>): void {
    if (node.detached) return;
    node.detached = true;
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
    this.count--;
  }

  /** Remove everything and return the values in FIFO order. */
  drain(): T[] {
    const values: T[] = [];
    let node = this.head;
    while (node) {
      node.detached = true;
      values.push(node.value);
      const next = node.next;
      node.prev = null;
      node.next = null;
      node = next;
    }
    this.head = null;
    this.tail = null;
    this.count = 0;
    return values;
  }
}
