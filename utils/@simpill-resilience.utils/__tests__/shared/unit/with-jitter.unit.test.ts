import { withJitter } from "../../../src/shared/with-jitter";

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
