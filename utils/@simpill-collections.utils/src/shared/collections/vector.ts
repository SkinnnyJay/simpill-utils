import { VALUE_0 } from "../constants";
import type { ICollection, IIndexable } from "../contracts";

/**
 * Dynamic array (Vector) with explicit capacity and index access.
 */
export class Vector<T> implements ICollection<T>, IIndexable<T> {
  private _buffer: (T | undefined)[] = [];
  private _length = VALUE_0;

  constructor(initialCapacity = VALUE_0) {
    if (initialCapacity > VALUE_0) {
      this._buffer = new Array(initialCapacity);
    }
  }

  get size(): number {
    return this._length;
  }

  isEmpty(): boolean {
    return this._length === VALUE_0;
  }

  clear(): void {
    this._buffer = [];
    this._length = VALUE_0;
  }

  toArray(): T[] {
    return this._buffer.slice(0, this._length) as T[];
  }

  *[Symbol.iterator](): IterableIterator<T> {
    // Lazy: no full-array copy per iteration. Do not mutate while iterating.
    for (let i = 0; i < this._length; i++) yield this._buffer[i] as T;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this._length) return undefined;
    return this._buffer[index] as T;
  }

  at(index: number): T | undefined {
    const i = index < 0 ? this._length + index : index;
    return this.get(i);
  }

  push(value: T): void {
    this.ensureCapacity(this._length + 1);
    this._buffer[this._length++] = value;
  }

  pop(): T | undefined {
    if (this._length === VALUE_0) return undefined;
    const value = this._buffer[--this._length] as T;
    this._buffer[this._length] = undefined; // release the reference for GC
    return value;
  }

  insertAt(index: number, value: T): void {
    if (index <= VALUE_0) {
      // copyWithin keeps the buffer length (capacity) stable; Array#unshift grew
      // the raw buffer past the reserved capacity, breaking capacity() invariants.
      this.ensureCapacity(this._length + 1);
      this._buffer.copyWithin(1, 0, this._length);
      this._buffer[0] = value;
      this._length++;
      return;
    }
    if (index >= this._length) {
      this.push(value);
      return;
    }
    this.ensureCapacity(this._length + 1);
    this._buffer.copyWithin(index + 1, index, this._length);
    this._buffer[index] = value;
    this._length++;
  }

  removeAt(index: number): T | undefined {
    if (index < 0 || index >= this._length) return undefined;
    const value = this._buffer[index] as T;
    this._buffer.copyWithin(index, index + 1, this._length);
    this._length--;
    this._buffer[this._length] = undefined; // clear the duplicated tail slot
    return value;
  }

  capacity(): number {
    return this._buffer.length;
  }

  reserve(capacity: number): void {
    if (capacity > this._buffer.length) {
      const newBuffer: (T | undefined)[] = new Array(capacity);
      for (let i = 0; i < this._length; i++) newBuffer[i] = this._buffer[i];
      this._buffer = newBuffer;
    }
  }

  shrinkToFit(): void {
    if (this._buffer.length > this._length) {
      this._buffer = this._buffer.slice(0, this._length);
    }
  }

  set(index: number, value: T): void {
    if (index < 0 || index >= this._length) return;
    this._buffer[index] = value;
  }

  private ensureCapacity(required: number): void {
    if (required > this._buffer.length) {
      const newCap = Math.max(required, this._buffer.length * 2 || 4);
      this.reserve(newCap);
    }
  }

  static fromArray<T>(arr: T[]): Vector<T> {
    const v = new Vector<T>(arr.length);
    for (const x of arr) v.push(x);
    return v;
  }
}
