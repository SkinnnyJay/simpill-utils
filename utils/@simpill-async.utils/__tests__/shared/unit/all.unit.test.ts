import { allWithLimit } from "../../../src/shared/all";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("allWithLimit", () => {
  it("runs thunks without limit by default", async () => {
    const results = await allWithLimit([async () => 1, async () => 2]);
    expect(results).toEqual([1, 2]);
  });

  it("limits concurrency when configured", async () => {
    let active = 0;
    let maxActive = 0;
    const tasks = Array.from({ length: 4 }, () => async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await wait(10);
      active -= 1;
      return active;
    });

    await allWithLimit(tasks, { concurrency: 2 });
    expect(maxActive).toBe(2);
  });
});
