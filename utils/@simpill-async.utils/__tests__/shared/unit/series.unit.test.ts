import { mapSeries, series } from "../../../src/shared/series";

describe("series", () => {
  it("runs thunks in order", async () => {
    const calls: number[] = [];
    const results = await series([
      async () => {
        calls.push(1);
        return 1;
      },
      async () => {
        calls.push(2);
        return 2;
      },
    ]);
    expect(results).toEqual([1, 2]);
    expect(calls).toEqual([1, 2]);
  });
});

describe("mapSeries", () => {
  it("maps items in series order", async () => {
    const calls: number[] = [];
    const results = await mapSeries([1, 2, 3], async (value) => {
      calls.push(value);
      return value * 2;
    });
    expect(results).toEqual([2, 4, 6]);
    expect(calls).toEqual([1, 2, 3]);
  });
});
