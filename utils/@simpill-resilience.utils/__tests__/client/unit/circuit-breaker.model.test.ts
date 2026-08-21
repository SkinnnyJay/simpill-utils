import { CircuitBreaker, CircuitOpenError } from "../../../src/client/circuit-breaker";

/**
 * Model-based property test: run random operation sequences against the
 * implementation AND a tiny reference state machine; states must agree at
 * every step. Seeded PRNG (mulberry32) keeps failures reproducible.
 */
type ModelState = "closed" | "open" | "half-open";

interface Model {
  state: ModelState;
  failures: number;
  successes: number;
  openUntil: number;
}

const FAILURE_THRESHOLD = 3;
const SUCCESS_THRESHOLD = 2;
const OPEN_MS = 30;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function modelTick(m: Model, now: number): void {
  if (m.state === "open" && now >= m.openUntil) {
    m.state = "half-open";
    m.successes = 0;
  }
}

function modelResult(m: Model, ok: boolean, now: number): void {
  modelTick(m, now);
  if (m.state === "open") return; // call was rejected, no outcome recorded
  if (ok) {
    if (m.state === "half-open") {
      m.successes++;
      if (m.successes >= SUCCESS_THRESHOLD) {
        m.state = "closed";
        m.failures = 0;
      }
    } else {
      m.failures = 0;
    }
    return;
  }
  if (m.state === "half-open") {
    m.state = "open";
    m.openUntil = now + OPEN_MS;
    return;
  }
  m.failures++;
  if (m.failures >= FAILURE_THRESHOLD) {
    m.state = "open";
    m.openUntil = now + OPEN_MS;
  }
}

describe("CircuitBreaker model-based property test", () => {
  beforeEach(() => {
    jest.useFakeTimers(); // deterministic clock: no boundary races
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("matches the reference state machine over random sequences", async () => {
    for (let seed = 1; seed <= 5; seed++) {
      const rand = mulberry32(seed);
      const cb = new CircuitBreaker({
        failureThreshold: FAILURE_THRESHOLD,
        successThreshold: SUCCESS_THRESHOLD,
        openMs: OPEN_MS,
        halfOpenMaxCalls: 5,
      });
      const model: Model = { state: "closed", failures: 0, successes: 0, openUntil: 0 };
      for (let step = 0; step < 60; step++) {
        if (rand() < 0.2) {
          // occasionally advance time far enough for open -> half-open
          await jest.advanceTimersByTimeAsync(OPEN_MS + 5);
        }
        const ok = rand() < 0.5;
        const now = Date.now();
        modelTick(model, now);
        expect(cb.getState()).toBe(model.state);
        try {
          await cb.run(() => (ok ? Promise.resolve(1) : Promise.reject(new Error("boom"))));
          modelResult(model, true, now);
        } catch (err) {
          if (err instanceof CircuitOpenError) {
            expect(model.state).toBe("open"); // rejected calls change nothing
          } else {
            modelResult(model, false, now);
          }
        }
        expect(cb.getState()).toBe(model.state);
      }
    }
  });
});
