import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { CalendarView } from "@/stores/app";

export function rangeFromCursor(cursorMs: number, view: CalendarView) {
  const d = new Date(cursorMs);
  let s: Date;
  let e: Date;
  switch (view) {
    case "day":
      s = startOfDay(d);
      e = endOfDay(d);
      break;
    case "week":
      s = startOfWeek(d, { weekStartsOn: 1 });
      e = endOfWeek(d, { weekStartsOn: 1 });
      break;
    case "month":
      s = startOfMonth(d);
      e = endOfMonth(d);
      break;
    case "year":
      s = startOfYear(d);
      e = endOfYear(d);
      break;
  }
  return { start: s.getTime(), end: e.getTime() };
}
