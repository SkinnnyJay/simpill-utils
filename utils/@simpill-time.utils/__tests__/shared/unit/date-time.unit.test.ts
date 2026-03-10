import {
  add,
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addMs,
  addSeconds,
  addWeeks,
  addYears,
  clampDate,
  delta,
  deltaStructured,
  diff,
  endOfDay,
  formatISO,
  getUnixTimeStamp,
  getUnixTimeStampMs,
  isFuture,
  isPast,
  isValidDate,
  startOfDay,
  toDateSafe,
} from "../../../src/shared";

describe("date-time", () => {
  const fixed = new Date("2024-06-15T12:00:00.000Z");

  describe("getUnixTimeStamp", () => {
    it("returns seconds for given date", () => {
      const ts = getUnixTimeStamp(fixed);
      expect(ts).toBe(Math.floor(fixed.getTime() / 1000));
    });
    it("returns current time in seconds when no arg", () => {
      const before = Math.floor(Date.now() / 1000);
      const ts = getUnixTimeStamp();
      const after = Math.floor(Date.now() / 1000);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after + 1);
    });
  });

  describe("getUnixTimeStampMs", () => {
    it("returns ms for given date", () => {
      expect(getUnixTimeStampMs(fixed)).toBe(fixed.getTime());
    });
  });

  describe("addDays", () => {
    it("adds positive days", () => {
      const r = addDays(fixed, 2);
      expect(r.getUTCDate()).toBe(17);
    });
    it("subtracts when negative", () => {
      const r = addDays(fixed, -2);
      expect(r.getUTCDate()).toBe(13);
    });
  });

  describe("addWeeks", () => {
    it("adds one week", () => {
      const r = addWeeks(fixed, 1);
      expect(r.getUTCDate()).toBe(22);
    });
  });

  describe("addMonths", () => {
    it("adds months", () => {
      const r = addMonths(fixed, 2);
      expect(r.getUTCMonth()).toBe(7);
      expect(r.getUTCDate()).toBe(15);
    });
  });

  describe("addYears", () => {
    it("adds years", () => {
      const r = addYears(fixed, 1);
      expect(r.getUTCFullYear()).toBe(2025);
    });
  });

  describe("addHours, addMinutes, addSeconds, addMs", () => {
    it("addHours", () => {
      const r = addHours(fixed, 2);
      expect(r.getTime() - fixed.getTime()).toBe(2 * 3600 * 1000);
    });
    it("addMinutes", () => {
      const r = addMinutes(fixed, 30);
      expect(r.getTime() - fixed.getTime()).toBe(30 * 60 * 1000);
    });
    it("addSeconds", () => {
      const r = addSeconds(fixed, 90);
      expect(r.getTime() - fixed.getTime()).toBe(90 * 1000);
    });
    it("addMs", () => {
      const r = addMs(fixed, 500);
      expect(r.getTime() - fixed.getTime()).toBe(500);
    });
  });

  describe("diff / delta", () => {
    it("diff returns to - from in ms", () => {
      const a = new Date(1000);
      const b = new Date(5000);
      expect(diff(a, b)).toBe(4000);
      expect(diff(b, a)).toBe(-4000);
    });
    it("delta is alias of diff", () => {
      const a = new Date(1000);
      const b = new Date(5000);
      expect(delta(a, b)).toBe(4000);
    });
  });

  describe("deltaStructured", () => {
    it("returns ms, seconds, minutes, hours, days", () => {
      const from = new Date(0);
      const to = new Date(2 * 24 * 3600 * 1000 + 3 * 3600 * 1000);
      const r = deltaStructured(from, to);
      expect(r.ms).toBe(to.getTime() - from.getTime());
      expect(r.days).toBe(2);
      expect(r.hours).toBe(2 * 24 + 3);
    });
  });

  describe("add (duration)", () => {
    it("adds mixed duration", () => {
      const r = add(fixed, { days: 1, hours: 2 });
      expect(r.getUTCDate()).toBe(16);
      expect(r.getUTCHours()).toBe(14);
    });
    it("adds weeks and months", () => {
      const r = add(fixed, { weeks: 1, months: 1 });
      expect(r.getUTCMonth()).toBe(6);
      expect(r.getUTCDate()).toBe(22);
    });
  });

  describe("startOfDay / endOfDay", () => {
    it("startOfDay zeros time", () => {
      const d = new Date("2024-06-15T14:30:00.500Z");
      const s = startOfDay(d);
      expect(s.getHours()).toBe(0);
      expect(s.getMinutes()).toBe(0);
      expect(s.getSeconds()).toBe(0);
      expect(s.getMilliseconds()).toBe(0);
    });
    it("endOfDay sets 23:59:59.999", () => {
      const d = new Date("2024-06-15T14:30:00.500Z");
      const e = endOfDay(d);
      expect(e.getHours()).toBe(23);
      expect(e.getMinutes()).toBe(59);
      expect(e.getSeconds()).toBe(59);
      expect(e.getMilliseconds()).toBe(999);
    });
  });

  describe("isValidDate", () => {
    it("returns true for valid Date", () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date("2024-01-01"))).toBe(true);
    });
    it("returns false for Invalid Date and non-Date", () => {
      expect(isValidDate(new Date("invalid"))).toBe(false);
      expect(isValidDate(123)).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe("toDateSafe", () => {
    it("returns Date for valid input", () => {
      const d = new Date("2024-01-01");
      expect(toDateSafe(d)).toBe(d);
      expect(toDateSafe(1704067200000).getTime()).toBe(1704067200000);
    });
    it("returns fallback for invalid input", () => {
      const fb = new Date(0);
      expect(toDateSafe("not a date", fb)).toBe(fb);
      expect(toDateSafe(null, fb).getTime()).toBe(0);
    });
  });

  describe("formatISO", () => {
    it("returns ISO string", () => {
      expect(formatISO(fixed)).toBe("2024-06-15T12:00:00.000Z");
    });
  });

  describe("isPast / isFuture", () => {
    it("isPast true for past date", () => {
      const past = new Date(Date.now() - 86400000);
      expect(isPast(past)).toBe(true);
    });
    it("isFuture true for future date", () => {
      const future = new Date(Date.now() + 86400000);
      expect(isFuture(future)).toBe(true);
    });
  });

  describe("clampDate", () => {
    it("clamps to min/max", () => {
      const min = new Date(1000);
      const max = new Date(5000);
      expect(clampDate(0, min, max).getTime()).toBe(1000);
      expect(clampDate(10000, min, max).getTime()).toBe(5000);
      expect(clampDate(3000, min, max).getTime()).toBe(3000);
    });
  });
});
