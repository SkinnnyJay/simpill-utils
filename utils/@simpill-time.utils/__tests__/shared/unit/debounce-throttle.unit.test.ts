import { debounce, throttle } from "../../../src/shared";

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("invokes after wait with no further calls", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel clears pending", () => {
    const fn = jest.fn();
    const d = debounce(fn, 100);
    d();
    d.cancel();
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("throttle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("invokes immediately on first call (leading)", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    t("a");
    expect(fn).toHaveBeenCalledWith("a");
    t("b");
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
