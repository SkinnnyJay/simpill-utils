import {
  add,
  addMonths,
  addYears,
  daysInMonth,
  endOfMonth,
  isSameDay,
  startOfMonth,
} from "../../../src/shared";

const utc = (y: number, m: number, d: number, h = 12): Date => new Date(Date.UTC(y, m, d, h));

describe("addMonths (end-of-month clamping)", () => {
  it("clamps Jan 31 + 1 month to Feb 29 in a leap year (not Mar 2)", () => {
    const r = addMonths(utc(2024, 0, 31), 1);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(29);
  });

  it("clamps Jan 31 + 1 month to Feb 28 in a non-leap year (not Mar 3)", () => {
    const r = addMonths(utc(2023, 0, 31), 1);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(28);
  });

  it("clamps going backward: Mar 31 - 1 month = Feb 29 (not Mar 2)", () => {
    const r = addMonths(utc(2024, 2, 31), -1);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(29);
  });

  it("preserves time-of-day when clamping", () => {
    const src = new Date(Date.UTC(2024, 0, 31, 7, 8, 9, 123));
    const r = addMonths(src, 1);
    expect(r.getUTCHours()).toBe(7);
    expect(r.getUTCMinutes()).toBe(8);
    expect(r.getUTCSeconds()).toBe(9);
    expect(r.getUTCMilliseconds()).toBe(123);
  });

  it("is unchanged for mid-month days (no clamp needed)", () => {
    const r = addMonths(utc(2024, 0, 15), 1);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(15);
  });

  it("amount 0 is a no-op; NaN yields Invalid Date", () => {
    const src = utc(2024, 5, 15);
    expect(addMonths(src, 0).getTime()).toBe(src.getTime());
    expect(Number.isNaN(addMonths(src, Number.NaN).getTime())).toBe(true);
  });

  it("round-trips for days that exist in every month (property, days 1-28)", () => {
    for (let day = 1; day <= 28; day++) {
      for (let months = 1; months <= 24; months++) {
        const src = utc(2023, 3, day);
        const roundTripped = addMonths(addMonths(src, months), -months);
        expect(roundTripped.getTime()).toBe(src.getTime());
      }
    }
  });
});

describe("addYears (leap clamping)", () => {
  it("clamps Feb 29 + 1 year to Feb 28 (not Mar 1)", () => {
    const r = addYears(utc(2024, 1, 29), 1);
    expect(r.getUTCFullYear()).toBe(2025);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(28);
  });

  it("Feb 29 + 4 years lands on Feb 29 again", () => {
    const r = addYears(utc(2024, 1, 29), 4);
    expect(r.getUTCFullYear()).toBe(2028);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(29);
  });
});

describe("add (duration months/years clamping)", () => {
  it("add({months: 1}) clamps like addMonths", () => {
    const r = add(utc(2024, 0, 31), { months: 1 });
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(29);
  });

  it("combines years+months through a single clamped step", () => {
    // Jan 31 2023 + 1y1m = Feb 2024 → clamp to 29
    const r = add(utc(2023, 0, 31), { years: 1, months: 1 });
    expect(r.getUTCFullYear()).toBe(2024);
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(29);
  });

  it("still applies days/time components after the month step", () => {
    const r = add(utc(2024, 0, 15), { months: 1, days: 2, hours: 3 });
    expect(r.getUTCMonth()).toBe(1);
    expect(r.getUTCDate()).toBe(17);
    expect(r.getUTCHours()).toBe(15);
  });
});

describe("month helpers", () => {
  it("startOfMonth / endOfMonth (local calendar)", () => {
    const d = new Date(2024, 1, 15, 10, 30);
    const start = startOfMonth(d);
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    const end = endOfMonth(d);
    expect(end.getDate()).toBe(29); // leap February
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it("daysInMonth is leap-aware", () => {
    expect(daysInMonth(new Date(2024, 1, 10))).toBe(29);
    expect(daysInMonth(new Date(2023, 1, 10))).toBe(28);
    expect(daysInMonth(new Date(2024, 0, 10))).toBe(31);
    expect(daysInMonth(new Date(2024, 3, 10))).toBe(30);
  });

  it("isSameDay compares local calendar days", () => {
    expect(isSameDay(new Date(2024, 5, 15, 0, 1), new Date(2024, 5, 15, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2024, 5, 15, 23, 59), new Date(2024, 5, 16, 0, 0))).toBe(false);
  });
});
