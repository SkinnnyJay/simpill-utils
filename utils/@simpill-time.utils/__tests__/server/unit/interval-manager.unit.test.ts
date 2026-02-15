describe("IntervalManager", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("clearGroup clears ttl timers", () => {
    const { intervalManager } = require("../../../src/server/interval-manager");
    const fn = jest.fn();
    intervalManager.setInterval("ttl-group", fn, 100, { group: "g", ttlMs: 1000 });
    expect(jest.getTimerCount()).toBe(2);
    intervalManager.clearGroup("g");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("clearAll clears ttl timers", () => {
    const { intervalManager } = require("../../../src/server/interval-manager");
    const fn = jest.fn();
    intervalManager.setInterval("ttl-all", fn, 100, { group: "g2", ttlMs: 1000 });
    expect(jest.getTimerCount()).toBe(2);
    intervalManager.clearAll();
    expect(jest.getTimerCount()).toBe(0);
  });
});
