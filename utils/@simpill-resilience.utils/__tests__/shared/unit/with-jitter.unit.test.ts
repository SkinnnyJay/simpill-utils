import { createDecorrelatedJitter, fullJitter, withJitter } from "../../../src/shared/with-jitter";

describe("withJitter", () => {
  it("returns a number in reasonable range around ms", () => {
    for (let i = 0; i < 20; i++) {
      const v = withJitter(100);
      expect(v).toBeGreaterThanOrEqual(80);
      expect(v).toBeLessThanOrEqual(120);
    }
  });

  it("respects maxMs when provided", () => {
    for (let i = 0; i < 20; i++) {
      const v = withJitter(1000, { factor: 0.5, maxMs: 100 });
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("respects custom factor", () => {
    const v = withJitter(100, { factor: 0 });
    expect(v).toBe(100);
  });
});

describe("fullJitter", () => {
  it("stays within [0, min(cap, base * 2^attempt)]", () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      for (let i = 0; i < 50; i++) {
        const v = fullJitter(attempt, { baseMs: 100, capMs: 2000 });
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(Math.min(2000, 100 * 2 ** attempt));
      }
    }
  });
});

describe("createDecorrelatedJitter", () => {
  it("stays within [baseMs, capMs] and starts near base", () => {
    for (let run = 0; run < 20; run++) {
      const next = createDecorrelatedJitter({ baseMs: 100, capMs: 3000 });
      let previous = 100;
      for (let i = 0; i < 15; i++) {
        const v = next();
        expect(v).toBeGreaterThanOrEqual(100);
        expect(v).toBeLessThanOrEqual(3000);
        expect(v).toBeLessThanOrEqual(Math.min(3000, previous * 3) + 1);
        previous = v;
      }
    }
  });
});
