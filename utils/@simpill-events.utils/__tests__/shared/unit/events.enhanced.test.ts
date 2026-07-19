import {
  createEventEmitter,
  EventWaitTimeoutError,
} from "../../../src/shared/events.utils";

type M = { tick: number; msg: string };

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe("EventEmitter — dispatch re-entrancy safety", () => {
  it("a listener added during emit is NOT called in the same cycle", () => {
    const em = createEventEmitter<M>();
    const calls: string[] = [];
    em.on("tick", () => {
      calls.push("A");
      em.on("tick", () => calls.push("B"));
    });
    em.emit("tick", 1);
    expect(calls).toEqual(["A"]); // B waits for the next emit (matches Node/emittery)
    em.emit("tick", 2);
    expect(calls).toEqual(["A", "A", "B"]);
  });

  it("a listener removed during emit is NOT called this cycle (better than Node)", () => {
    const em = createEventEmitter<M>();
    const calls: string[] = [];
    const b = () => calls.push("B");
    em.on("tick", () => {
      calls.push("A");
      em.off("tick", b); // remove a not-yet-invoked sibling
    });
    em.on("tick", b);
    em.emit("tick", 1);
    expect(calls).toEqual(["A"]); // Node would still call B; we skip it
  });

  it("does not infinite-loop when a handler re-subscribes itself", () => {
    const em = createEventEmitter<M>();
    let n = 0;
    const self = () => {
      n++;
      em.on("tick", self); // would blow up with live iteration
    };
    em.on("tick", self);
    em.emit("tick", 1);
    expect(n).toBe(1);
  });
});

describe("EventEmitter — once/off correctness", () => {
  it("off(originalHandler) cancels a once-listener before it fires", () => {
    const em = createEventEmitter<M>();
    const fn = jest.fn();
    em.once("tick", fn);
    em.off("tick", fn);
    em.emit("tick", 1);
    expect(fn).not.toHaveBeenCalled();
    expect(em.listenerCount("tick")).toBe(0);
  });

  it("the unsubscribe returned by once() also cancels it", () => {
    const em = createEventEmitter<M>();
    const fn = jest.fn();
    const off = em.once("tick", fn);
    off();
    em.emit("tick", 1);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("EventEmitter — emit return value", () => {
  it("returns true when the event had a listener, false otherwise", () => {
    const em = createEventEmitter<M>();
    expect(em.emit("tick", 1)).toBe(false);
    em.on("tick", () => {});
    expect(em.emit("tick", 1)).toBe(true);
  });
});

describe("EventEmitter — emitAsync", () => {
  it("serial mode awaits handlers in registration order", async () => {
    const em = createEventEmitter<M>();
    const order: string[] = [];
    em.on("tick", async () => {
      await delay(20);
      order.push("slow");
    });
    em.on("tick", () => {
      order.push("fast");
    });
    await em.emitAsync("tick", 1);
    expect(order).toEqual(["slow", "fast"]); // fast waited for slow
  });

  it("parallel mode runs handlers concurrently", async () => {
    const em = createEventEmitter<M>();
    const order: string[] = [];
    em.on("tick", async () => {
      await delay(30);
      order.push("slow");
    });
    em.on("tick", () => {
      order.push("fast");
    });
    await em.emitAsync("tick", 1, { mode: "parallel" });
    expect(order).toEqual(["fast", "slow"]); // fast finished first
  });

  it("rejects with the sole error when one handler throws, and still calls onError", async () => {
    const onError = jest.fn();
    const em = createEventEmitter<M>({ onError });
    em.on("tick", () => {
      throw new Error("boom");
    });
    await expect(em.emitAsync("tick", 1)).rejects.toThrow("boom");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("rejects with AggregateError when multiple handlers fail", async () => {
    const em = createEventEmitter<M>();
    em.on("tick", () => Promise.reject(new Error("e1")));
    em.on("tick", () => {
      throw new Error("e2");
    });
    await expect(em.emitAsync("tick", 1, { mode: "parallel" })).rejects.toBeInstanceOf(
      AggregateError,
    );
  });

  it("snapshots listeners before awaiting (added-during-await not called)", async () => {
    const em = createEventEmitter<M>();
    const calls: string[] = [];
    em.on("tick", async () => {
      calls.push("A");
      em.on("tick", () => calls.push("B"));
      await delay(5);
    });
    await em.emitAsync("tick", 1);
    expect(calls).toEqual(["A"]);
  });
});

describe("EventEmitter — onAny / offAny", () => {
  it("onAny receives every event with name and payload, after specific listeners", () => {
    const em = createEventEmitter<M>();
    const seen: Array<[keyof M, unknown]> = [];
    const specific: string[] = [];
    em.on("tick", () => specific.push("specific"));
    const off = em.onAny((event, payload) => seen.push([event, payload]));
    em.emit("tick", 7);
    em.emit("msg", "hi");
    expect(seen).toEqual([
      ["tick", 7],
      ["msg", "hi"],
    ]);
    expect(specific).toEqual(["specific"]);
    off();
    em.emit("tick", 8);
    expect(seen).toHaveLength(2);
  });

  it("emit returns true when only an any-listener is present", () => {
    const em = createEventEmitter<M>();
    em.onAny(() => {});
    expect(em.emit("tick", 1)).toBe(true);
  });
});

describe("EventEmitter — waitFor", () => {
  it("resolves with the next payload", async () => {
    const em = createEventEmitter<M>();
    const p = em.waitFor("tick");
    em.emit("tick", 99);
    await expect(p).resolves.toBe(99);
    expect(em.listenerCount("tick")).toBe(0); // cleaned up
  });

  it("rejects if the signal is already aborted", async () => {
    const em = createEventEmitter<M>();
    const ac = new AbortController();
    ac.abort(new Error("nope"));
    await expect(em.waitFor("tick", { signal: ac.signal })).rejects.toThrow("nope");
    expect(em.listenerCount("tick")).toBe(0);
  });

  it("rejects when aborted mid-wait and unsubscribes", async () => {
    const em = createEventEmitter<M>();
    const ac = new AbortController();
    const p = em.waitFor("tick", { signal: ac.signal });
    expect(em.listenerCount("tick")).toBe(1);
    ac.abort(new Error("cancelled"));
    await expect(p).rejects.toThrow("cancelled");
    expect(em.listenerCount("tick")).toBe(0);
  });

  it("rejects with EventWaitTimeoutError after timeout and cleans up", async () => {
    const em = createEventEmitter<M>();
    const p = em.waitFor("tick", { timeout: 20 });
    await expect(p).rejects.toBeInstanceOf(EventWaitTimeoutError);
    expect(em.listenerCount("tick")).toBe(0);
  });
});

describe("EventEmitter — maxListeners leak guard", () => {
  it("fires onLeak once when the cap is first exceeded, and never touches console", () => {
    const onLeak = jest.fn();
    const em = createEventEmitter<M>({ maxListeners: 2, onLeak });
    em.on("tick", () => {});
    em.on("tick", () => {});
    expect(onLeak).not.toHaveBeenCalled();
    em.on("tick", () => {}); // 3 > 2
    em.on("tick", () => {}); // still leaked; should not fire again
    expect(onLeak).toHaveBeenCalledTimes(1);
    expect(onLeak).toHaveBeenCalledWith("tick", 3);
  });

  it("is disabled by default (maxListeners 0)", () => {
    const onLeak = jest.fn();
    const em = createEventEmitter<M>({ onLeak });
    for (let i = 0; i < 100; i++) em.on("tick", () => {});
    expect(onLeak).not.toHaveBeenCalled();
  });

  it("setMaxListeners / getMaxListeners round-trip; negatives clamp to 0", () => {
    const em = createEventEmitter<M>();
    em.setMaxListeners(5);
    expect(em.getMaxListeners()).toBe(5);
    em.setMaxListeners(-1);
    expect(em.getMaxListeners()).toBe(0);
  });
});
