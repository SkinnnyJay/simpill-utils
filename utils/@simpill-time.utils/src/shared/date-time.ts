/** Date/time arithmetic and comparison; pure, runtime-agnostic. */
import {
  MONTHS_PER_YEAR,
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_SECOND,
} from "./constants";

export type DateInput = Date | number;

export interface Duration {
  days?: number;
  weeks?: number;
  months?: number;
  years?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  ms?: number;
}

export interface DeltaResult {
  ms: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
}

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

/** Returns current Unix timestamp in seconds. */
export function getUnixTimeStamp(date?: DateInput): number {
  const d = date === undefined ? Date.now() : toDate(date).getTime();
  return Math.floor(d / MS_PER_SECOND);
}

/** Returns Unix timestamp in milliseconds. */
export function getUnixTimeStampMs(date?: DateInput): number {
  return date === undefined ? Date.now() : toDate(date).getTime();
}

/** Adds days to a date; returns new Date (immutable). */
export function addDays(date: DateInput, amount: number): Date {
  const d = new Date(toDate(date).getTime());
  d.setDate(d.getDate() + amount);
  return d;
}

/** Adds weeks to a date; returns new Date (immutable). */
export function addWeeks(date: DateInput, amount: number): Date {
  return addDays(date, amount * 7);
}

/**
 * Adds months to a date; returns new Date (immutable).
 *
 * Clamps to the end of the target month instead of letting the day-of-month
 * overflow: Jan 31 + 1 month = Feb 29/28 (NOT Mar 2/3). Time-of-day is
 * preserved. Negative amounts clamp the same way (Mar 31 - 1 month = Feb 29,
 * not Mar 2).
 */
export function addMonths(date: DateInput, amount: number): Date {
  const d = new Date(toDate(date).getTime());
  if (Number.isNaN(amount)) return new Date(Number.NaN);
  if (!amount) return d;
  const dayOfMonth = d.getDate();
  // Day 0 of month M+1 is the last day of month M — this is the end of the
  // desired month regardless of its length (28/29/30/31).
  const endOfDesiredMonth = new Date(d.getTime());
  endOfDesiredMonth.setMonth(d.getMonth() + amount + 1, 0);
  const daysInTargetMonth = endOfDesiredMonth.getDate();
  if (dayOfMonth >= daysInTargetMonth) {
    // Original day doesn't exist in the target month: clamp to its last day
    // (endOfDesiredMonth already carries the original time-of-day).
    return endOfDesiredMonth;
  }
  d.setFullYear(endOfDesiredMonth.getFullYear(), endOfDesiredMonth.getMonth(), dayOfMonth);
  return d;
}

/**
 * Adds years to a date; returns new Date (immutable).
 * Clamps Feb 29 to Feb 28 on non-leap target years (NOT Mar 1).
 */
export function addYears(date: DateInput, amount: number): Date {
  return addMonths(date, amount * MONTHS_PER_YEAR);
}

/** Adds hours to a date; returns new Date (immutable). */
export function addHours(date: DateInput, amount: number): Date {
  const d = new Date(toDate(date).getTime());
  d.setTime(d.getTime() + amount * MS_PER_HOUR);
  return d;
}

/** Adds minutes to a date; returns new Date (immutable). */
export function addMinutes(date: DateInput, amount: number): Date {
  const d = new Date(toDate(date).getTime());
  d.setTime(d.getTime() + amount * MS_PER_MINUTE);
  return d;
}

/** Adds seconds to a date; returns new Date (immutable). */
export function addSeconds(date: DateInput, amount: number): Date {
  const d = new Date(toDate(date).getTime());
  d.setTime(d.getTime() + amount * MS_PER_SECOND);
  return d;
}

/** Adds milliseconds to a date; returns new Date (immutable). */
export function addMs(date: DateInput, amount: number): Date {
  const d = new Date(toDate(date).getTime());
  d.setTime(d.getTime() + amount);
  return d;
}

/**
 * Difference in milliseconds: (to - from). Positive when `to` is after `from`.
 */
export function diff(from: DateInput, to: DateInput): number {
  return toDate(to).getTime() - toDate(from).getTime();
}

/**
 * Same as diff(from, to). Alias for clarity when reading "delta between a and b".
 */
export function delta(from: DateInput, to: DateInput): number {
  return diff(from, to);
}

/**
 * Returns a structured delta between two dates (from → to).
 */
export function deltaStructured(from: DateInput, to: DateInput): DeltaResult {
  const ms = diff(from, to);
  const abs = Math.abs(ms);
  const sign = ms < 0 ? -1 : 1;
  return {
    ms,
    seconds: sign * Math.floor(abs / MS_PER_SECOND),
    minutes: sign * Math.floor(abs / MS_PER_MINUTE),
    hours: sign * Math.floor(abs / MS_PER_HOUR),
    days: sign * Math.floor(abs / MS_PER_DAY),
  };
}

/**
 * Adds a duration to a date. Returns a new Date (immutable).
 * Order of application: years → months → weeks → days → hours → minutes → seconds → ms.
 * Years and months are applied together through end-of-month clamping
 * (Jan 31 + {months: 1} = Feb 29/28, not Mar 2/3).
 */
export function add(date: DateInput, duration: Duration): Date {
  let d = new Date(toDate(date).getTime());
  const totalMonths = (duration.years ?? 0) * MONTHS_PER_YEAR + (duration.months ?? 0);
  if (totalMonths !== 0) {
    d = addMonths(d, totalMonths);
  }
  if (duration.weeks !== undefined) {
    d.setDate(d.getDate() + duration.weeks * 7);
  }
  if (duration.days !== undefined) {
    d.setDate(d.getDate() + duration.days);
  }
  if (duration.hours !== undefined) {
    d.setTime(d.getTime() + duration.hours * MS_PER_HOUR);
  }
  if (duration.minutes !== undefined) {
    d.setTime(d.getTime() + duration.minutes * MS_PER_MINUTE);
  }
  if (duration.seconds !== undefined) {
    d.setTime(d.getTime() + duration.seconds * MS_PER_SECOND);
  }
  if (duration.ms !== undefined) {
    d.setTime(d.getTime() + duration.ms);
  }
  return d;
}

/** Start of day (00:00:00.000) in local time. */
export function startOfDay(date: DateInput): Date {
  const d = new Date(toDate(date).getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End of day (23:59:59.999) in local time. */
export function endOfDay(date: DateInput): Date {
  const d = new Date(toDate(date).getTime());
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Start of month (1st, 00:00:00.000) in local time. */
export function startOfMonth(date: DateInput): Date {
  const d = new Date(toDate(date).getTime());
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End of month (last day, 23:59:59.999) in local time. */
export function endOfMonth(date: DateInput): Date {
  const d = new Date(toDate(date).getTime());
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Number of days in the date's month (28-31, leap-aware). */
export function daysInMonth(date: DateInput): number {
  const d = toDate(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** True if both dates fall on the same local calendar day. */
export function isSameDay(a: DateInput, b: DateInput): boolean {
  const da = toDate(a);
  const db = toDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** True if value is a valid Date (instance of Date and not Invalid Date). */
export function isValidDate(value: unknown): value is Date {
  if (!(value instanceof Date)) return false;
  return !Number.isNaN(value.getTime());
}

/** Parse to Date; returns fallback (or new Date()) for invalid input. */
export function toDateSafe(value: unknown, fallback?: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value);
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback ?? new Date();
}

/** Format date as ISO string (YYYY-MM-DDTHH:mm:ss.sssZ). */
export function formatISO(date: DateInput): string {
  return toDate(date).toISOString();
}

/** True if date is strictly before now. */
export function isPast(date: DateInput): boolean {
  return toDate(date).getTime() < Date.now();
}

/** True if date is strictly after now. */
export function isFuture(date: DateInput): boolean {
  return toDate(date).getTime() > Date.now();
}

/** Clamp date to [min, max]; returns new Date. */
export function clampDate(date: DateInput, min: DateInput, max: DateInput): Date {
  const t = toDate(date).getTime();
  const minT = toDate(min).getTime();
  const maxT = toDate(max).getTime();
  if (t < minT) return new Date(minT);
  if (t > maxT) return new Date(maxT);
  return new Date(t);
}
