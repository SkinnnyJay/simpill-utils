import { createObservable } from "../../../src/shared/observer";

describe("createObservable", () => {
  it("notifies subscribers and supports unsubscribe", () => {
    const observable = createObservable<number>();
    let sum = 0;

    const unsubscribe = observable.subscribe((value) => {
      sum += value;
    });

    observable.next(2);
    unsubscribe();
    observable.next(3);

    expect(sum).toBe(2);
  });

  it("clears observers and reports counts", () => {
    const observable = createObservable<string>();
    const unsubscribe = observable.subscribe(() => {});

    expect(observable.getObserverCount()).toBe(1);
    unsubscribe();
    expect(observable.getObserverCount()).toBe(0);

    observable.subscribe(() => {});
    observable.subscribe(() => {});
    expect(observable.getObserverCount()).toBe(2);
    observable.clear();
    expect(observable.getObserverCount()).toBe(0);
  });
});
