import { mapConcurrent } from "../../../src/shared/map";

describe("mapConcurrent", () => {
  it("maps items with optional concurrency", async () => {
    const result = await mapConcurrent([1, 2, 3], async (value) => value * 2, {
      concurrency: 1,
    });
    expect(result).toEqual([2, 4, 6]);
  });
});
