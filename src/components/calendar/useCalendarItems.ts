"use client";

import { useMemo } from "react";
import { useEvents, useTasksInRange } from "@/db/hooks";
import type { CalendarItem } from "@/types/domain";
import { expandEvent } from "./expandRecurrence";

export function useCalendarItems(rangeStart: number, rangeEnd: number) {
  const tasks = useTasksInRange(rangeStart, rangeEnd);
  // Recurring events may have a parent `start` far outside the range,
  // so we fetch all events and let the expander filter by range.
  const events = useEvents();

  return useMemo<CalendarItem[]>(() => {
    const taskItems = tasks
      .filter((t) => t.start != null && t.status !== "done")
      .map<CalendarItem>((t) => ({ kind: "task", data: t }));
    const eventItems = events.flatMap((e) =>
      expandEvent(e, rangeStart, rangeEnd).map<CalendarItem>((data) => ({
        kind: "event",
        data,
      })),
    );
    return [...taskItems, ...eventItems].sort((a, b) => {
      const aStart = a.kind === "task" ? (a.data.start ?? 0) : a.data.start;
      const bStart = b.kind === "task" ? (b.data.start ?? 0) : b.data.start;
      return aStart - bStart;
    });
  }, [tasks, events, rangeStart, rangeEnd]);
}
