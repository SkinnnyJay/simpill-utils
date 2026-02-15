import { BoundedArray } from "../../../src/server";

describe("BoundedArray", () => {
  it("evicts from front when over maxSize", () => {
    const arr = new BoundedArray<number>(2);
    arr.push(1);
    arr.push(2);
    arr.push(3);
    expect(arr.length).toBe(2);
    expect(arr.toArray()).toEqual([2, 3]);
  });
});
