import { VALUE_0 } from "../constants";
import type { ICollection } from "../contracts";

/**
 * TypedSet: Set with optional custom equality and/or validator.
 *
 * When no custom `equals` is provided, storage is a native Set (SameValueZero),
 * making add/has/delete O(1). The previous implementation scanned an array with
 * `===` on every operation — O(n) per op, O(n^2) to build a set of n items —
 * even when no custom equality was in play. The array-scan path is retained
 * only when `equals` is supplied (custom equality cannot be hashed generically).
 */
export interface TypedSetOptions<T> {
  equals?: (a: T, b: T) => boolean;
  validate?: (value: T) => boolean;
}

export class TypedSet<T> implements ICollection<T> {
  private readonly _equals: ((a: T, b: T) => boolean) | undefined;
  private readonly _validate: ((value: T) => boolean) | undefined;
  private readonly _set: Set<T> | null;
  private readonly _items: T[] | null;

  constructor(options: TypedSetOptions<T> = {}) {
    this._equals = options.equals;
    this._validate = options.validate;
    if (this._equals) {
      this._set = null;
      this._items = [];
    } else {
      this._set = new Set<T>();
      this._items = null;
    }
  }

  /** Build a TypedSet from any iterable. */
  static from<T>(iterable: Iterable<T>, options: TypedSetOptions<T> = {}): TypedSet<T> {
    const set = new TypedSet<T>(options);
    for (const value of iterable) set.add(value);
    return set;
  }

  get size(): number {
    return this._set ? this._set.size : (this._items as T[]).length;
  }

  isEmpty(): boolean {
    return this.size === VALUE_0;
  }

  clear(): void {
    if (this._set) this._set.clear();
    else (this._items as T[]).length = 0;
  }

  toArray(): T[] {
    return this._set ? [...this._set] : [...(this._items as T[])];
  }

  [Symbol.iterator](): Iterator<T> {
    return this._set ? this._set[Symbol.iterator]() : (this._items as T[])[Symbol.iterator]();
  }

  add(value: T): this {
    if (this._validate && !this._validate(value)) return this;
    if (this._set) {
      this._set.add(value);
    } else if (!this.has(value)) {
      (this._items as T[]).push(value);
    }
    return this;
  }

  has(value: T): boolean {
    if (this._set) return this._set.has(value);
    const equals = this._equals as (a: T, b: T) => boolean;
    return (this._items as T[]).some((x) => equals(x, value));
  }

  delete(value: T): boolean {
    if (this._set) return this._set.delete(value);
    const equals = this._equals as (a: T, b: T) => boolean;
    const items = this._items as T[];
    const i = items.findIndex((x) => equals(x, value));
    if (i === -1) return false;
    items.splice(i, 1);
    return true;
  }

  forEach(cb: (value: T, valueAgain: T, set: TypedSet<T>) => void): void {
    for (const v of this) cb(v, v, this);
  }

  /** Set-parity iterators (insertion order). */
  keys(): IterableIterator<T> {
    return this.valuesIterator();
  }

  values(): IterableIterator<T> {
    return this.valuesIterator();
  }

  *entries(): IterableIterator<[T, T]> {
    for (const v of this) yield [v, v];
  }

  private *valuesIterator(): IterableIterator<T> {
    for (const v of this) yield v;
  }
}
