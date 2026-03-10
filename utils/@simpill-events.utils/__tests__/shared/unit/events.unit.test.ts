import { createEventEmitter } from "../../../src/shared/events.utils";

type Map = { foo: string; bar: number };

describe("EventEmitter", () => {
  it("on/emit", () => {
    const em = createEventEmitter<Map>();
    const fn = jest.fn();
    em.on("foo", fn);
    em.emit("foo", "hi");
    expect(fn).toHaveBeenCalledWith("hi");
  });

  it("off removes handler", () => {
    const em = createEventEmitter<Map>();
    const fn = jest.fn();
    em.on("foo", fn);
    em.off("foo", fn);
    em.emit("foo", "x");
    expect(fn).not.toHaveBeenCalled();
  });

  it("once calls handler once then removes it", () => {
    const em = createEventEmitter<Map>();
    const fn = jest.fn();
    em.once("foo", fn);
    em.emit("foo", "first");
    em.emit("foo", "second");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("first");
  });

  it("listenerCount returns count per event and total", () => {
    const em = createEventEmitter<Map>();
    expect(em.listenerCount()).toBe(0);
    const unsub1 = em.on("foo", () => {});
    em.on("foo", () => {});
    em.on("bar", () => {});
    expect(em.listenerCount("foo")).toBe(2);
    expect(em.listenerCount("bar")).toBe(1);
    expect(em.listenerCount()).toBe(3);
    unsub1();
    expect(em.listenerCount("foo")).toBe(1);
    expect(em.listenerCount()).toBe(2);
  });

  it("clear(event) removes all listeners for event", () => {
    const em = createEventEmitter<Map>();
    const fn = jest.fn();
    em.on("foo", fn);
    em.clear("foo");
    em.emit("foo", "x");
    expect(fn).not.toHaveBeenCalled();
  });

  it("clear() removes all listeners", () => {
    const em = createEventEmitter<Map>();
    const f1 = jest.fn();
    const f2 = jest.fn();
    em.on("foo", f1);
    em.on("bar", f2);
    em.clear();
    em.emit("foo", "a");
    em.emit("bar", 1);
    expect(f1).not.toHaveBeenCalled();
    expect(f2).not.toHaveBeenCalled();
  });

  it("onError is called when handler throws", () => {
    const onError = jest.fn();
    const em = createEventEmitter<Map>({ onError });
    em.on("foo", () => {
      throw new Error("boom");
    });
    em.emit("foo", "x");
    expect(onError).toHaveBeenCalledWith("foo", expect.any(Error));
  });

  it("supports symbol keys", () => {
    const sym = Symbol("ev");
    type M = { [sym]: number };
    const em = createEventEmitter<M>();
    const fn = jest.fn();
    em.on(sym, fn);
    em.emit(sym, 42);
    expect(fn).toHaveBeenCalledWith(42);
  });
});
