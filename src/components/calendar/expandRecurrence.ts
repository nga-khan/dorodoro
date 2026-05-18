import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import type { CalendarEvent, RecurrenceRule, Weekday } from "@/types/domain";

const HARD_CAP = 366; // safety: never produce more than this many instances per event

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
 * Expand a single (potentially recurring) event into the instances that
 * overlap [rangeStart, rangeEnd]. Returns the original event when no rrule.
 * Each generated instance gets a synthetic id `<parent>#<occurrenceMs>` and
 * preserves the parent's title/color/duration.
 */
export function expandEvent(
  ev: CalendarEvent,
  rangeStart: number,
  rangeEnd: number,
): CalendarEvent[] {
  if (!ev.rrule) {
    if (ev.end < rangeStart || ev.start > rangeEnd) return [];
    return [ev];
  }
  const { freq, interval = 1, byweekday, until, count } = ev.rrule;
  const duration = ev.end - ev.start;
  const exSet = new Set(ev.exDates ?? []);
  const out: CalendarEvent[] = [];

  let cursor = new Date(ev.start);
  let occurrenceCount = 0;
  let produced = 0;
  const cutoff = until != null ? Math.min(until, rangeEnd) : rangeEnd;

  while (cursor.getTime() <= cutoff && produced < HARD_CAP) {
    if (count != null && occurrenceCount >= count) break;

    let include = true;
    if (freq === "weekly" && byweekday && byweekday.length > 0) {
      include = byweekday.includes(cursor.getDay() as Weekday);
    }

    if (include) {
      const startMs = cursor.getTime();
      const endMs = startMs + duration;
      occurrenceCount += 1;
      if (!exSet.has(startMs) && endMs >= rangeStart && startMs <= rangeEnd) {
        out.push({
          ...ev,
          id: `${ev.id}#${startMs}`,
          start: startMs,
          end: endMs,
        });
        produced += 1;
      }
    }

    cursor = step(cursor, freq, interval);
  }

  return out;
}

/** Extract the parent id from a synthetic occurrence id. */
export function parentEventId(id: string): string {
  const i = id.indexOf("#");
  return i === -1 ? id : id.slice(0, i);
}
