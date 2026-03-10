import {
  avg,
  clamp,
  isFiniteNumber,
  isInRange,
  isInteger,
  lerp,
  randomInt,
  roundTo,
  sum,
  toFloat,
  toInt,
} from "../../../src/shared/number.utils";

describe("number.utils", () => {
  it("isFiniteNumber and isInteger", () => {
    expect(isFiniteNumber(1)).toBe(true);
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isInteger(2)).toBe(true);
    expect(isInteger(2.5)).toBe(false);
  });

  it("clamp", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("roundTo", () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.235, 2)).toBe(1.24);
  });

  it("toInt and toFloat", () => {
    expect(toInt("42")).toBe(42);
    expect(toInt("x", 0)).toBe(0);
    expect(toFloat("3.14")).toBe(3.14);
    expect(toFloat(NaN, -1)).toBe(-1);
  });

  it("isInRange", () => {
    expect(isInRange(5, 0, 10)).toBe(true);
    expect(isInRange(0, 0, 10)).toBe(true);
    expect(isInRange(10, 0, 10)).toBe(true);
    expect(isInRange(5, 0, 10, { inclusive: false })).toBe(true);
    expect(isInRange(0, 0, 10, { inclusive: false })).toBe(false);
  });

  it("randomInt is in range", () => {
    for (let i = 0; i < 50; i++) {
      const n = randomInt(1, 5);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it("lerp", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("sum and avg", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(avg([1, 2, 3])).toBe(2);
    expect(avg([])).toBe(0);
  });
});
