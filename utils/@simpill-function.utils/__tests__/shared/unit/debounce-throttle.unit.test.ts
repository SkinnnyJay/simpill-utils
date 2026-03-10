import { debounce, throttle } from "../../../src/shared/debounce-throttle";

describe("debounce", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls after wait", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d(1);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith(1);
  });
});

describe("throttle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls at most once per wait", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    t(1);
    t(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
