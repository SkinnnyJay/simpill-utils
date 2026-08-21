import { debounce, throttle } from "../../../src/shared/debounce-throttle";

describe("debounce (uplift)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("invokes with the latest args", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d(1);
    d(2);
    d(3);
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("leading edge invokes immediately", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100, { leading: true });
    d(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
    jest.advanceTimersByTime(100);
    // single call in the window -> no trailing duplicate (lodash semantics)
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("leading+trailing fires both edges when called more than once", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100, { leading: true, trailing: true });
    d(1);
    d(2);
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
    expect(fn).toHaveBeenNthCalledWith(2, 2);
  });

  it("trailing:false with leading:true only fires leading", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100, { leading: true, trailing: false });
    d(1);
    d(2);
    d(3);
    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("maxWait bounds delay under continuous calls (starvation guard)", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100, { maxWait: 300 });
    // Call every 50ms forever: plain debounce would NEVER fire.
    for (let i = 0; i < 20; i++) {
      d(i);
      jest.advanceTimersByTime(50);
    }
    // 1000ms elapsed, maxWait=300 -> should have fired ~3 times, not 0.
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("old debounce starves without maxWait (documents the hazard)", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    for (let i = 0; i < 20; i++) {
      d(i);
      jest.advanceTimersByTime(50);
    }
    expect(fn).not.toHaveBeenCalled();
  });

  it("preserves `this`", () => {
    const obj = {
      value: 42,
      captured: 0,
      save: debounce(function (this: { value: number; captured: number }) {
        this.captured = this.value;
      }, 100),
    };
    obj.save();
    jest.advanceTimersByTime(100);
    expect(obj.captured).toBe(42);
  });

  it("returns and caches the last invocation result", () => {
    const d = debounce((x: number) => x * 2, 100, { leading: true });
    expect(d(5)).toBe(10);
    // throttled follow-up returns cached result
    expect(d(100)).toBe(10);
  });

  it("flush invokes pending call immediately and returns the result", () => {
    const fn = jest.fn((x: number) => x + 1);
    const d = debounce(fn, 100);
    d(41);
    expect(d.flush()).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush with nothing pending is a no-op returning last result", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    expect(d.flush()).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it("cancel drops the pending invocation", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d(1);
    d.cancel();
    jest.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
    expect(d.pending()).toBe(false);
  });

  it("pending reflects scheduled state", () => {
    const d = debounce(() => undefined, 100);
    expect(d.pending()).toBe(false);
    d();
    expect(d.pending()).toBe(true);
    jest.advanceTimersByTime(100);
    expect(d.pending()).toBe(false);
  });

  it("AbortSignal cancels a pending invocation", () => {
    const fn = jest.fn();
    const controller = new AbortController();
    const d = debounce(fn, 100, { signal: controller.signal });
    d(1);
    controller.abort();
    jest.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it("already-aborted signal disables the wrapper", () => {
    const fn = jest.fn();
    const controller = new AbortController();
    controller.abort();
    const d = debounce(fn, 100, { signal: controller.signal });
    d(1);
    jest.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });

  it("validates wait (negative, NaN, Infinity) and maxWait", () => {
    const fn = () => undefined;
    expect(() => debounce(fn, -1)).toThrow(/non-negative finite/);
    expect(() => debounce(fn, Number.NaN)).toThrow(/non-negative finite/);
    expect(() => debounce(fn, Number.POSITIVE_INFINITY)).toThrow(/non-negative finite/);
    expect(() => debounce(fn, 100, { maxWait: -5 })).toThrow(/non-negative finite/);
  });

  it("wait=0 defers to the next timer tick", () => {
    const fn = jest.fn();
    const d = debounce(fn, 0);
    d(1);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledWith(1);
  });
});

describe("throttle (uplift)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("REGRESSION: trailing edge fires with the LATEST args, not the first queued", () => {
    // Old implementation froze lastArgs at the first queued call: calls made
    // while the trailing timer was pending were dropped entirely, so the
    // trailing edge fired with STALE data. Lodash contract: "func is invoked
    // with the last arguments provided to the throttled function."
    const fn = jest.fn();
    const t = throttle(fn, 100);
    t(1); // leading -> fires with 1
    t(2); // queued
    t(3); // must REPLACE the queued args (old code dropped this)
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
    expect(fn).toHaveBeenNthCalledWith(2, 3);
  });

  it("invokes at most once per window during a burst, plus trailing", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    for (let i = 0; i < 10; i++) {
      t(i);
      jest.advanceTimersByTime(10);
    }
    jest.advanceTimersByTime(200);
    // 100ms window over ~100ms of calls: leading + intermediate + trailing
    expect(fn.mock.calls.length).toBeLessThanOrEqual(3);
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(2);
    // trailing got the newest payload
    expect(fn).toHaveBeenLastCalledWith(9);
  });

  it("leading:false defers the first call to the trailing edge", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100, { leading: false });
    t(1);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("trailing:false suppresses the trailing call", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100, { trailing: false });
    t(1);
    t(2);
    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("cancel resets the window so the next call fires leading", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    t(1);
    t(2);
    t.cancel();
    t(3);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 3);
  });

  it("flush fires the pending trailing call immediately", () => {
    const fn = jest.fn((x: number) => x * 10);
    const t = throttle(fn, 100);
    t(1);
    t(2);
    expect(t.flush()).toBe(20);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("preserves `this`", () => {
    const obj = {
      hits: 0,
      track: throttle(function (this: { hits: number }) {
        this.hits += 1;
      }, 100),
    };
    obj.track();
    expect(obj.hits).toBe(1);
  });

  it("AbortSignal cancels pending trailing call", () => {
    const fn = jest.fn();
    const controller = new AbortController();
    const t = throttle(fn, 100, { signal: controller.signal });
    t(1);
    t(2);
    controller.abort();
    jest.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1); // leading only
  });

  it("recovers if the system clock moves backwards", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    const realNow = Date.now;
    t(1);
    expect(fn).toHaveBeenCalledTimes(1);
    // simulate a wall-clock jump backwards
    const base = Date.now();
    Date.now = () => base - 10_000;
    try {
      t(2);
      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      Date.now = realNow;
    }
  });
});
