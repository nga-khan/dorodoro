import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import type { RecurrenceRule, Weekday } from "@/types/domain";

function step(
  date: Date,
  freq: RecurrenceRule["freq"],
  interval: number,
): Date {
  switch (freq) {
    case "daily":
      return addDays(date, interval);
    case "weekly":
      return addWeeks(date, interval);
    case "monthly":
      return addMonths(date, interval);
    case "yearly":
      return addYears(date, interval);
  }
}

/**
 * Given a base date and a rrule, return the next occurrence strictly after
 * `from`. Honors weekly `byweekday`. Returns null when the rrule's `until`
 * bound is exceeded.
 */
export function nextOccurrenceAfter(
  from: Date,
  rrule: RecurrenceRule,
): Date | null {
  const interval = rrule.interval ?? 1;
  if (
    rrule.freq === "weekly" &&
    rrule.byweekday &&
    rrule.byweekday.length > 0
  ) {
    // Walk one day at a time, but skip whole weeks when crossing weekly boundary.
    // Simpler: walk day-by-day up to `interval * 7 * 8` days as a safety cap.
    const days = new Set<Weekday>(rrule.byweekday);
    let cursor = addDays(from, 1);
    const cap = interval * 7 * 8 + 7;
    for (let i = 0; i < cap; i += 1) {
      if (days.has(cursor.getDay() as Weekday)) {
        if (rrule.until != null && cursor.getTime() > rrule.until) return null;
        return cursor;
      }
      cursor = addDays(cursor, 1);
    }
    return null;
  }
  const next = step(from, rrule.freq, interval);
  if (rrule.until != null && next.getTime() > rrule.until) return null;
  return next;
}

/** Advance a date-only `YYYY-MM-DD` key to its next occurrence. */
export function nextDueKey(due: string, rrule: RecurrenceRule): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due);
  if (!m) return null;
  const base = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const next = nextOccurrenceAfter(base, rrule);
  if (!next) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}
