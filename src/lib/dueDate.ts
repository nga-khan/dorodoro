import { differenceInCalendarDays } from "date-fns";
import type { Task } from "@/types/domain";

/** Local `YYYY-MM-DD` for a date (defaults to now). */
export function dateKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse `YYYY-MM-DD` into a local Date at 00:00. Returns null for invalid input. */
export function parseDueKey(key: string | undefined | null): Date | null {
  if (!key) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** True when the task has a due date in the past and is not yet done. */
export function isOverdue(task: Pick<Task, "due" | "status">): boolean {
  if (!task.due || task.status === "done") return false;
  const due = parseDueKey(task.due);
  if (!due) return false;
  return differenceInCalendarDays(new Date(), due) > 0;
}

/** True for `done` tasks with no due, or non-done with a due >= today. */
export function isDueToday(task: Pick<Task, "due" | "status">): boolean {
  if (!task.due) return false;
  const due = parseDueKey(task.due);
  if (!due) return false;
  return differenceInCalendarDays(new Date(), due) === 0;
}

export type DueTone = "overdue" | "today" | "soon" | "future" | "none";

/** Classify how urgent a due date is, relative to today. */
export function dueTone(task: Pick<Task, "due" | "status">): DueTone {
  if (!task.due) return "none";
  if (task.status === "done") return "none";
  const due = parseDueKey(task.due);
  if (!due) return "none";
  const days = differenceInCalendarDays(due, new Date());
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 2) return "soon";
  return "future";
}

/** Short human label like "오늘", "내일", "D-3", "2일 지남". */
export function formatDueLabel(due: string): string {
  const d = parseDueKey(due);
  if (!d) return due;
  const days = differenceInCalendarDays(d, new Date());
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  if (days === -1) return "어제";
  if (days < 0) return `${-days}일 지남`;
  return `D-${days}`;
}
