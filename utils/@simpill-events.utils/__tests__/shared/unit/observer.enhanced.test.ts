import { createObservable } from "../../../src/shared/observer.object.utils";

describe("Observable — notify re-entrancy safety", () => {
  it("a subscriber added during notify is NOT called this cycle", () => {
    const o = createObservable(0);
    const calls: string[] = [];
    o.subscribe(() => {
      calls.push("A");
      o.subscribe(() => calls.push("B"));
    });
    o.setValue(1);
    expect(calls).toEqual(["A"]);
    o.setValue(2);
    expect(calls).toEqual(["A", "A", "B"]);
  });

  it("a subscriber unsubscribed during notify is skipped this cycle", () => {
    const o = createObservable(0);
    const calls: string[] = [];
    const b = () => calls.push("B");
    let offB: () => void = () => {};
    o.subscribe(() => {
      calls.push("A");
      offB();
    });
    offB = o.subscribe(b);
    o.setValue(1);
    expect(calls).toEqual(["A"]);
  });

  it("listenerCount reflects active subscribers", () => {
    const o = createObservable(0);
    expect(o.listenerCount()).toBe(0);
    const off = o.subscribe(() => {});
    o.subscribe(() => {});
    expect(o.listenerCount()).toBe(2);
    off();
    expect(o.listenerCount()).toBe(1);
  });
});
