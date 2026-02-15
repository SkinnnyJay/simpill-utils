describe("IntervalManager", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("setInterval runs callback periodically", () => {
    const { intervalManager } = require("../../../src/server");
    const fn = jest.fn();
    const id = intervalManager.setInterval("test", fn, 100);
    jest.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(2);
    intervalManager.clearInterval(id);
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("createManagedInterval returns cleanup", () => {
    const { createManagedInterval } = require("../../../src/server");
    const fn = jest.fn();
    const cleanup = createManagedInterval("m", fn, 100);
    jest.advanceTimersByTime(150);
    cleanup();
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("setInterval supports ttl auto-clear", () => {
    const { intervalManager } = require("../../../src/server");
    const fn = jest.fn();
    const id = intervalManager.setInterval("ttl", fn, 100, { ttlMs: 250 });
    jest.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(2);
    intervalManager.clearInterval(id);
  });

  it("setTimeout ttl can cancel before firing", () => {
    const { intervalManager } = require("../../../src/server");
    const fn = jest.fn();
    intervalManager.setTimeout("ttl-timeout", fn, 500, { ttlMs: 200 });
    jest.advanceTimersByTime(600);
    expect(fn).not.toHaveBeenCalled();
  });

  it("clearGroup clears ttl timers", () => {
    const { intervalManager } = require("../../../src/server");
    const fn = jest.fn();
    intervalManager.setInterval("ttl-group", fn, 100, { group: "g", ttlMs: 1000 });
    expect(jest.getTimerCount()).toBe(2);
    intervalManager.clearGroup("g");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("timer factory destroys all managed timers", () => {
    const { createTimerFactory } = require("../../../src/server");
    const factory = createTimerFactory({ group: "test-factory" });
    const fn = jest.fn();
    factory.createInterval("a", fn, 50);
    factory.createInterval("b", fn, 50);
    jest.advanceTimersByTime(120);
    const callsBefore = fn.mock.calls.length;
    factory.destroy();
    jest.advanceTimersByTime(200);
    expect(fn.mock.calls.length).toBe(callsBefore);
  });
});
