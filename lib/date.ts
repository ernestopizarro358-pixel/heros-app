import type { DayKey } from "./data/types";

/** The app's "day" changes at midnight in Bolivia, not UTC. */
export const TIME_ZONE = "America/La_Paz";

const DAY_MS = 86_400_000;

const dayPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` for the given instant, in America/La_Paz. */
export function dayKeyOf(instant: Date): DayKey {
  const parts = dayPartsFormatter.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function todayKey(): DayKey {
  return dayKeyOf(new Date());
}

/** Calendar date (as UTC midnight) for pure date arithmetic. */
function toUtcDate(day: DayKey): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtcDate(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: DayKey, amount: number): DayKey {
  return fromUtcDate(new Date(toUtcDate(day).getTime() + amount * DAY_MS));
}

export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((toUtcDate(a).getTime() - toUtcDate(b).getTime()) / DAY_MS);
}

/** The `count` days ending at `end` (inclusive), oldest first. */
export function lastDays(end: DayKey, count: number): DayKey[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const longFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const longYearFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "Jueves, 23 de julio" (adds the year if it isn't the current one). */
export function formatDayLong(day: DayKey): string {
  const sameYear = day.slice(0, 4) === todayKey().slice(0, 4);
  return capitalize((sameYear ? longFormatter : longYearFormatter).format(toUtcDate(day)));
}

/** "mar, 14 jul" */
export function formatDayShort(day: DayKey): string {
  return shortFormatter.format(toUtcDate(day));
}

/** Formats an ISO timestamp as its La Paz calendar day. */
export function formatTimestampLong(iso: string): string {
  return formatDayLong(dayKeyOf(new Date(iso)));
}
