import { CircuitBreaker } from "../../../src/client/circuit-breaker";

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
