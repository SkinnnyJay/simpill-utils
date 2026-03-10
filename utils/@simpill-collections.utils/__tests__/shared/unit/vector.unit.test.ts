/**
 * @file Vector unit tests
 */

import { Vector } from "../../../src/shared/collections/vector";

describe("Vector", () => {
  it("starts empty", () => {
    const v = new Vector<number>();
    expect(v.size).toBe(0);
    expect(v.isEmpty()).toBe(true);
  });

  it("push and pop", () => {
    const v = new Vector<number>();
    v.push(1);
    v.push(2);
    expect(v.size).toBe(2);
    expect(v.pop()).toBe(2);
    expect(v.pop()).toBe(1);
    expect(v.pop()).toBeUndefined();
  });

  it("get set at", () => {
    const v = Vector.fromArray([10, 20, 30]);
    expect(v.get(0)).toBe(10);
    expect(v.at(-1)).toBe(30);
    expect(v.at(-2)).toBe(20);
    v.set(1, 99);
    expect(v.get(1)).toBe(99);
  });

  it("insertAt and removeAt", () => {
    const v = new Vector<number>();
    v.push(1);
    v.push(3);
    v.insertAt(1, 2);
    expect(v.toArray()).toEqual([1, 2, 3]);
    expect(v.removeAt(1)).toBe(2);
    expect(v.toArray()).toEqual([1, 3]);
  });

  it("reserve and capacity", () => {
    const v = new Vector<number>(4);
    expect(v.capacity()).toBe(4);
    v.push(1);
    v.push(2);
    v.reserve(10);
    expect(v.capacity()).toBe(10);
    expect(v.size).toBe(2);
  });

  it("shrinkToFit", () => {
    const v = new Vector<number>(10);
    v.push(1);
    v.push(2);
    v.shrinkToFit();
    expect(v.capacity()).toBe(2);
  });

  it("fromArray", () => {
    const v = Vector.fromArray([1, 2, 3]);
    expect(v.toArray()).toEqual([1, 2, 3]);
  });

  it("get out of bounds returns undefined", () => {
    const v = new Vector<number>();
    v.push(1);
    expect(v.get(-1)).toBeUndefined();
    expect(v.get(1)).toBeUndefined();
  });

  it("constructor with initialCapacity 0", () => {
    const v = new Vector<number>(0);
    v.push(1);
    expect(v.size).toBe(1);
    expect(v.get(0)).toBe(1);
  });

  it("set ignores out of range index", () => {
    const v = Vector.fromArray([1, 2, 3]);
    v.set(-1, 99);
    v.set(10, 99);
    expect(v.toArray()).toEqual([1, 2, 3]);
  });
});
