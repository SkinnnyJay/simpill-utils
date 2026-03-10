import { filterAsync, reduceAsync } from "../../../src/shared/filter-reduce";

describe("filterAsync", () => {
  it("filters values with async predicate", async () => {
    const result = await filterAsync([1, 2, 3, 4], async (value) => value % 2 === 0);
    expect(result).toEqual([2, 4]);
  });

  it("filters with concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    const result = await filterAsync(
      [1, 2, 3, 4],
      async (value) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return value > 2;
      },
      { concurrency: 2 },
    );
    expect(result).toEqual([3, 4]);
    expect(maxActive).toBe(2);
  });
});

describe("reduceAsync", () => {
  it("reduces values in order", async () => {
    const result = await reduceAsync([1, 2, 3], async (acc, value) => acc + value, 0);
    expect(result).toBe(6);
  });
});
