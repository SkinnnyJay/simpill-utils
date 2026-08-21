import { delay } from "../../../src/shared/delay";

describe("delay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves after the specified delay", async () => {
    const promise = delay(100);
    jest.advanceTimersByTime(100);
    await promise;
  });

  it("does not resolve before the specified delay", async () => {
    let resolved = false;
    const p = delay(100).then(() => {
      resolved = true;
    });
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    expect(resolved).toBe(false);
    jest.advanceTimersByTime(50);
    await p;
    expect(resolved).toBe(true);
  });
});
