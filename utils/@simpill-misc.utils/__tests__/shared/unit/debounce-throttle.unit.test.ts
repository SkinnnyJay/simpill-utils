describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("invokes after wait with no further calls", () => {
    const fn = jest.fn();
    const { debounce } = require("../../../src/shared");
    const d = debounce(fn, 100);
    d(1);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("cancel prevents invocation", () => {
    const fn = jest.fn();
    const { debounce } = require("../../../src/shared");
    const d = debounce(fn, 100);
    d(1);
    d.cancel();
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it("flush invokes immediately", () => {
    const fn = jest.fn();
    const { debounce } = require("../../../src/shared");
    const d = debounce(fn, 100);
    d(1);
    d.flush();
    expect(fn).toHaveBeenCalledWith(1);
  });
});

describe("throttle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("invokes at most once per wait", () => {
    const fn = jest.fn();
    const { throttle } = require("../../../src/shared");
    const t = throttle(fn, 100);
    t(1);
    t(2);
    t(3);
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
