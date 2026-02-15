import { timeAsync, timePromise } from "../../../src/shared/time";

describe("timeAsync", () => {
  it("returns result and duration", async () => {
    const { result, durationMs } = await timeAsync(async () => "ok");
    expect(result).toBe("ok");
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe("timePromise", () => {
  it("times an existing promise", async () => {
    const { result, durationMs } = await timePromise(Promise.resolve(10));
    expect(result).toBe(10);
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });
});
