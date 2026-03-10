/**
 * @file CircularBuffer unit tests
 */

import { CircularBuffer } from "../../../src/shared/collections/circular-buffer";

describe("CircularBuffer", () => {
  it("throws when capacity < 1", () => {
    expect(() => new CircularBuffer(0)).toThrow(RangeError);
  });

  it("push and shift", () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    b.push(3);
    expect(b.size).toBe(3);
    expect(b.shift()).toBe(1);
    expect(b.shift()).toBe(2);
    expect(b.shift()).toBe(3);
    expect(b.shift()).toBeUndefined();
  });

  it("drops oldest when full", () => {
    const b = new CircularBuffer<number>(2);
    b.push(1);
    b.push(2);
    b.push(3);
    expect(b.size).toBe(2);
    expect(b.shift()).toBe(2);
    expect(b.shift()).toBe(3);
  });

  it("peekFront and peekBack", () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    expect(b.peekFront()).toBe(1);
    expect(b.peekBack()).toBe(2);
  });

  it("get by index", () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    expect(b.get(0)).toBe(1);
    expect(b.get(1)).toBe(2);
  });

  it("isFull and clear", () => {
    const b = new CircularBuffer<number>(2);
    b.push(1);
    expect(b.isFull()).toBe(false);
    b.push(2);
    expect(b.isFull()).toBe(true);
    b.clear();
    expect(b.size).toBe(0);
    expect(b.isEmpty()).toBe(true);
  });

  it("is iterable", () => {
    const b = new CircularBuffer<number>(3);
    b.push(1);
    b.push(2);
    expect([...b]).toEqual([1, 2]);
  });
});
