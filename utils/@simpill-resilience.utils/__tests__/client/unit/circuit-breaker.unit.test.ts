import { CircuitBreaker, CircuitOpenError } from "../../../src/client/circuit-breaker";

describe("CircuitBreaker", () => {
  it("starts closed", () => {
    const cb = new CircuitBreaker();
    expect(cb.getState()).toBe("closed");
  });

  it("opens after failureThreshold failures", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, openMs: 10000 });
    await expect(cb.run(() => Promise.reject(new Error("e1")))).rejects.toThrow("e1");
    await expect(cb.run(() => Promise.reject(new Error("e2")))).rejects.toThrow("e2");
    expect(cb.getState()).toBe("open");
    await expect(cb.run(() => Promise.resolve(1))).rejects.toThrow("Circuit breaker is open");
  });

  it("transitions to half-open after openMs and then closed after successThreshold successes", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      openMs: 10,
      halfOpenMaxCalls: 5,
    });
    await expect(cb.run(() => Promise.reject(new Error("e")))).rejects.toThrow("e");
    expect(cb.getState()).toBe("open");
    await new Promise((r) => setTimeout(r, 20));
    expect(cb.getState()).toBe("half-open");
    await cb.run(() => Promise.resolve(1));
    await cb.run(() => Promise.resolve(2));
    expect(cb.getState()).toBe("closed");
  });

  it("calls onStateChange when state changes", async () => {
    const transitions: Array<{ state: string; previous: string }> = [];
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 1,
      openMs: 10,
      halfOpenMaxCalls: 5,
      onStateChange: (state, previousState) => {
        transitions.push({ state, previous: previousState });
      },
    });
    await expect(cb.run(() => Promise.reject(new Error("e")))).rejects.toThrow("e");
    expect(transitions).toEqual([{ state: "open", previous: "closed" }]);
    await new Promise((r) => setTimeout(r, 20));
    cb.getState();
    expect(transitions).toEqual([
      { state: "open", previous: "closed" },
      { state: "half-open", previous: "open" },
    ]);
    await cb.run(() => Promise.resolve(1));
    expect(transitions).toEqual([
      { state: "open", previous: "closed" },
      { state: "half-open", previous: "open" },
      { state: "closed", previous: "half-open" },
    ]);
  });
});

describe("CircuitBreaker uplift", () => {
  it("half-open probe slots are released on settle (no budget deadlock)", async () => {
    // Pre-fix: halfOpenCalls never decremented, so successThreshold >
    // halfOpenMaxCalls could never close the circuit — permanent lockout.
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 3,
      openMs: 10,
      halfOpenMaxCalls: 1,
    });
    await expect(cb.run(() => Promise.reject(new Error("e")))).rejects.toThrow("e");
    await new Promise((r) => setTimeout(r, 20));
    expect(cb.getState()).toBe("half-open");
    await cb.run(() => Promise.resolve(1));
    await cb.run(() => Promise.resolve(2));
    await cb.run(() => Promise.resolve(3));
    expect(cb.getState()).toBe("closed");
  });

  it("limits CONCURRENT half-open probes, rejecting overflow with CircuitOpenError", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openMs: 10, halfOpenMaxCalls: 1 });
    await expect(cb.run(() => Promise.reject(new Error("e")))).rejects.toThrow("e");
    await new Promise((r) => setTimeout(r, 20));
    expect(cb.getState()).toBe("half-open");
    let release: () => void = () => {};
    const inFlight = cb.run(
      () =>
        new Promise<number>((r) => {
          release = () => r(1);
        }),
    );
    const overflow = cb.run(() => Promise.resolve(2));
    await expect(overflow).rejects.toBeInstanceOf(CircuitOpenError);
    await expect(overflow).rejects.toThrow("Circuit breaker half-open max calls reached");
    release();
    await expect(inFlight).resolves.toBe(1);
  });

  it("rejects with CircuitOpenError carrying state when open", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openMs: 10000 });
    await expect(cb.run(() => Promise.reject(new Error("e")))).rejects.toThrow("e");
    try {
      await cb.run(() => Promise.resolve(1));
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CircuitOpenError);
      expect((err as CircuitOpenError).state).toBe("open");
      expect((err as Error).name).toBe("CircuitOpenError");
    }
  });

  it("does not count AbortError as a breaker failure by default", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, openMs: 10000 });
    const abortErr = new Error("Operation aborted.");
    abortErr.name = "AbortError";
    await expect(cb.run(() => Promise.reject(abortErr))).rejects.toThrow("Operation aborted.");
    expect(cb.getState()).toBe("closed");
  });

  it("honors a custom shouldCountError filter", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      openMs: 10000,
      shouldCountError: (e) => (e as Error).message !== "expected",
    });
    await expect(cb.run(() => Promise.reject(new Error("expected")))).rejects.toThrow("expected");
    expect(cb.getState()).toBe("closed");
    await expect(cb.run(() => Promise.reject(new Error("real")))).rejects.toThrow("real");
    expect(cb.getState()).toBe("open");
  });

  it("exposes metrics and supports manual open()/close()", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, openMs: 10000 });
    await expect(cb.run(() => Promise.reject(new Error("e")))).rejects.toThrow("e");
    expect(cb.getMetrics()).toMatchObject({ state: "closed", failureCount: 1 });
    cb.open();
    expect(cb.getState()).toBe("open");
    await expect(cb.run(() => Promise.resolve(1))).rejects.toThrow("Circuit breaker is open");
    cb.close();
    expect(cb.getState()).toBe("closed");
    expect(cb.getMetrics()).toMatchObject({ state: "closed", failureCount: 0, successCount: 0 });
    await expect(cb.run(() => Promise.resolve(1))).resolves.toBe(1);
  });
});
