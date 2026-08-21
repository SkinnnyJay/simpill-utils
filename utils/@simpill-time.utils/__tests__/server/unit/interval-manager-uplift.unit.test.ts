import { IntervalManager, intervalManager } from "../../../src/server/interval-manager";

type SignalListener = (...args: unknown[]) => void;

const withIsolatedSignal = (
  signal: NodeJS.Signals,
  run: (invokeLast: () => void) => void,
): void => {
  const saved = process.listeners(signal) as SignalListener[];
  process.removeAllListeners(signal);
  try {
    run(() => {
      const listeners = process.listeners(signal) as SignalListener[];
      const last = listeners[listeners.length - 1];
      expect(last).toBeDefined();
      last();
    });
  } finally {
    process.removeAllListeners(signal);
    for (const l of saved) process.on(signal, l);
  }
};

describe("shutdown signal handling", () => {
  afterEach(() => {
    intervalManager.clearAll();
    jest.restoreAllMocks();
  });

  it("re-raises SIGTERM after cleanup when no other handler exists (process stays killable)", () => {
    withIsolatedSignal("SIGTERM", (invokeLast) => {
      const mgr = new IntervalManager();
      mgr.setInterval("victim", () => {}, 60_000);
      const killSpy = jest.spyOn(process, "kill").mockImplementation(() => true);
      invokeLast();
      expect(killSpy).toHaveBeenCalledWith(process.pid, "SIGTERM");
      expect(mgr.getStats().activeIntervals).toBe(0);
      mgr.clearAll();
    });
  });

  it("does NOT re-raise when the app has its own SIGTERM handler (app owns exit)", () => {
    withIsolatedSignal("SIGTERM", () => {
      const mgr = new IntervalManager();
      mgr.setInterval("victim", () => {}, 60_000);
      const appHandler = jest.fn();
      process.on("SIGTERM", appHandler);
      const killSpy = jest.spyOn(process, "kill").mockImplementation(() => true);
      // Invoke the manager's handler (registered before the app handler).
      const listeners = process.listeners("SIGTERM") as SignalListener[];
      listeners[0]();
      expect(killSpy).not.toHaveBeenCalled();
      process.off("SIGTERM", appHandler);
      mgr.clearAll();
    });
  });

  it("registers handlers lazily (importing/creating adds no listeners) and re-registers after clearAll", () => {
    withIsolatedSignal("SIGTERM", () => {
      const before = process.listenerCount("SIGTERM");
      const mgr = new IntervalManager();
      expect(process.listenerCount("SIGTERM")).toBe(before);
      mgr.setTimeout("t", () => {}, 60_000);
      expect(process.listenerCount("SIGTERM")).toBe(before + 1);
      mgr.clearAll();
      expect(process.listenerCount("SIGTERM")).toBe(before);
      // The pre-uplift implementation registered handlers once in the
      // constructor; a clearAll() left every later timer without shutdown
      // cleanup. Now the next timer re-registers.
      mgr.setTimeout("t2", () => {}, 60_000);
      expect(process.listenerCount("SIGTERM")).toBe(before + 1);
      mgr.clearAll();
    });
  });
});

describe("onError hook", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    intervalManager.clearAll();
    jest.useRealTimers();
  });

  it("invokes onError with the thrown error and timer info; interval keeps running", () => {
    const mgr = new IntervalManager();
    const boom = new Error("boom");
    const onError = jest.fn();
    const cb = jest
      .fn()
      .mockImplementationOnce(() => {
        throw boom;
      })
      .mockImplementation(() => {});
    const id = mgr.setInterval("explosive", cb, 100, { onError });
    jest.advanceTimersByTime(200);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(boom, { id, name: "explosive", type: "interval" });
    expect(cb).toHaveBeenCalledTimes(2);
    mgr.clearAll();
  });

  it("default behavior still swallows (back-compat)", () => {
    const mgr = new IntervalManager();
    mgr.setTimeout(
      "quiet",
      () => {
        throw new Error("swallowed");
      },
      100,
    );
    expect(() => jest.advanceTimersByTime(100)).not.toThrow();
    mgr.clearAll();
  });
});

describe("unref support", () => {
  afterEach(() => intervalManager.clearAll());

  it("unref: true releases the event-loop hold (hasRef false)", () => {
    const mgr = new IntervalManager();
    const id = mgr.setTimeout("bg", () => {}, 60_000, { unref: true });
    expect(mgr.hasRef(id)).toBe(false);
    mgr.clearAll();
  });

  it("default keeps the ref (hasRef true) and hasRef returns undefined for unknown ids", () => {
    const mgr = new IntervalManager();
    const id = mgr.setInterval("fg", () => {}, 60_000);
    expect(mgr.hasRef(id)).toBe(true);
    expect(mgr.hasRef("nope")).toBeUndefined();
    mgr.clearAll();
  });
});

describe("AbortSignal support", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    intervalManager.clearAll();
    jest.useRealTimers();
  });

  it("abort clears a pending timeout", () => {
    const mgr = new IntervalManager();
    const ac = new AbortController();
    const cb = jest.fn();
    mgr.setTimeout("abortable", cb, 100, { signal: ac.signal });
    ac.abort();
    jest.advanceTimersByTime(500);
    expect(cb).not.toHaveBeenCalled();
    expect(mgr.getStats().activeTimeouts).toBe(0);
  });

  it("an already-aborted signal never schedules the callback", () => {
    const mgr = new IntervalManager();
    const ac = new AbortController();
    ac.abort();
    const cb = jest.fn();
    mgr.setInterval("stillborn", cb, 100, { signal: ac.signal });
    jest.advanceTimersByTime(500);
    expect(cb).not.toHaveBeenCalled();
    expect(mgr.getStats().activeIntervals).toBe(0);
  });
});

describe("stats", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    intervalManager.clearAll();
    jest.useRealTimers();
  });

  it("naturally fired timeouts count as totalFired, not totalCleared", () => {
    const mgr = new IntervalManager();
    mgr.setTimeout("fires", () => {}, 100);
    jest.advanceTimersByTime(100);
    const stats = mgr.getStats();
    expect(stats.totalFired).toBe(1);
    expect(stats.totalCleared).toBe(0);
    expect(stats.activeTimeouts).toBe(0);
  });
});

describe("driftless interval", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    intervalManager.clearAll();
    jest.useRealTimers();
  });

  it("fires on the interval and stops when cleared", () => {
    const mgr = new IntervalManager();
    const cb = jest.fn();
    const id = mgr.setDriftlessInterval("steady", cb, 100);
    jest.advanceTimersByTime(100);
    expect(cb).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(300);
    expect(cb).toHaveBeenCalledTimes(4);
    mgr.clearInterval(id);
    jest.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(4);
  });

  it("supports ttlMs like other managed timers", () => {
    const mgr = new IntervalManager();
    const cb = jest.fn();
    mgr.setDriftlessInterval("mortal", cb, 100, { ttlMs: 250 });
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(mgr.getStats().activeIntervals).toBe(0);
  });

  it("routes errors through onError and keeps ticking", () => {
    const mgr = new IntervalManager();
    const onError = jest.fn();
    const cb = jest.fn().mockImplementationOnce(() => {
      throw new Error("tick failed");
    });
    mgr.setDriftlessInterval("resilient", cb, 100, { onError });
    jest.advanceTimersByTime(300);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledTimes(3);
    mgr.clearAll();
  });

  it("is exposed through the timer factory", async () => {
    const { createTimerFactory } = await import("../../../src/server/interval-manager");
    const factory = createTimerFactory({ group: "drift" });
    const cb = jest.fn();
    const cancel = factory.createDriftlessInterval("f", cb, 100);
    jest.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledTimes(2);
    cancel();
    jest.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledTimes(2);
    factory.destroy();
  });
});
