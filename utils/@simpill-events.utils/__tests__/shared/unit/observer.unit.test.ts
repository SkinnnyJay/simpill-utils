import { createObservable } from "../../../src/shared/observer.object.utils";

describe("Observable", () => {
  it("getValue/setValue and notifies", () => {
    const o = createObservable(0);
    const fn = jest.fn();
    o.subscribe(fn);
    o.setValue(1);
    expect(o.getValue()).toBe(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it("get/set are aliases for getValue/setValue", () => {
    const o = createObservable(10);
    expect(o.get()).toBe(10);
    o.set(20);
    expect(o.getValue()).toBe(20);
  });

  it("update(fn) applies function to current value", () => {
    const o = createObservable(5);
    const fn = jest.fn();
    o.subscribe(fn);
    o.update((n) => n + 1);
    expect(o.getValue()).toBe(6);
    expect(fn).toHaveBeenCalledWith(6);
  });

  it("emitOnSubscribe invokes listener immediately with current value", () => {
    const o = createObservable(42);
    const fn = jest.fn();
    o.subscribe(fn, { emitOnSubscribe: true });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(42);
    o.setValue(43);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(43);
  });

  it("does not notify when value is same (Object.is)", () => {
    const o = createObservable({ id: 1 });
    const fn = jest.fn();
    o.subscribe(fn);
    o.setValue(o.getValue());
    expect(fn).not.toHaveBeenCalled();
  });

  it("onError is called when listener throws", () => {
    const onError = jest.fn();
    const o = createObservable(0, { onError });
    o.subscribe(() => {
      throw new Error("boom");
    });
    o.setValue(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
