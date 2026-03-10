import { mapAsync } from "../../../src/shared/map";

describe("mapAsync", () => {
  it("maps values with async mapper", async () => {
    const result = await mapAsync([1, 2, 3], async (value) => value * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it("maps with concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    const result = await mapAsync(
      [1, 2, 3, 4],
      async (value) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return value;
      },
      { concurrency: 2 },
    );
    expect(result).toEqual([1, 2, 3, 4]);
    expect(maxActive).toBe(2);
  });

  it("throws AbortError when signal already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      mapAsync([1, 2], async (x) => x, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
