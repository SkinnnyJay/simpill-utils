import { PollingManager } from "../../../src/server";

describe("PollingManager", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("stops when stopCondition is met", async () => {
    const pollFn = jest.fn().mockResolvedValue("done");
    const manager = new PollingManager(pollFn, {
      initialIntervalMs: 100,
      maxIntervalMs: 500,
      backoffFactor: 1.5,
      stopCondition: (r: string) => r === "done",
    });
    manager.start();
    await jest.advanceTimersByTimeAsync(100);
    expect(pollFn).toHaveBeenCalled();
    expect(manager.getIsPolling()).toBe(false);
  });
});
