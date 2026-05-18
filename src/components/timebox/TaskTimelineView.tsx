"use client";

import { useMemo } from "react";
import { useTasksInRange } from "@/db/hooks";
import { updateTask } from "@/db/repositories/tasks";
import { useAppStore } from "@/stores/app";

const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_HEIGHT = 36; // px per hour

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function TaskTimelineView() {
  const dayStart = startOfDay();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const tasks = useTasksInRange(dayStart, dayEnd);
  const setSelected = useAppStore((s) => s.setSelectedTaskId);

  const rangeStartMs = dayStart + START_HOUR * 60 * 60 * 1000;
  const rangeEndMs = dayStart + END_HOUR * 60 * 60 * 1000;
  const totalMs = rangeEndMs - rangeStartMs;

  const hourLabels = useMemo(
    () => Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i),
    [],
  );

  const placements = useMemo(
    () =>
      tasks
        .filter((t) => t.start != null)
        .map((t) => {
          const start = Math.max(t.start ?? 0, rangeStartMs);
          const end = Math.min(
            t.end ?? (t.start ?? 0) + 30 * 60_000,
            rangeEndMs,
          );
          const top =
            ((start - rangeStartMs) / totalMs) * TOTAL_HOURS * SLOT_HEIGHT;
          const height = Math.max(
            20,
            ((end - start) / totalMs) * TOTAL_HOURS * SLOT_HEIGHT,
          );
          return { task: t, top, height };
        }),
    [tasks, rangeStartMs, rangeEndMs, totalMs],
  );

  const onCellClick = async (hour: number) => {
    const start = dayStart + hour * 60 * 60 * 1000;
    const end = start + 30 * 60_000;
    // Place first unscheduled task into this slot, if any.
    const candidate = tasks.find((t) => t.start == null);
    if (candidate) {
      await updateTask(candidate.id, { start, end });
    }
  };

  return (
    <div className="relative flex h-full overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg-0)]">
      <div className="w-12 shrink-0 border-r border-[var(--line)] text-[10px] text-[var(--ink-3)]">
        {hourLabels.map((h) => (
          <div
            key={h}
            style={{ height: SLOT_HEIGHT }}
            className="px-1 pt-1 font-mono"
          >
            {String(h).padStart(2, "0")}
          </div>
        ))}
      </div>
      <div className="relative flex-1">
        {hourLabels.slice(0, -1).map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onCellClick(h)}
            style={{ height: SLOT_HEIGHT }}
            className="block w-full border-b border-[var(--line)] hover:bg-[var(--bg-1)]"
            aria-label={`${h}시 슬롯`}
          />
        ))}
        {placements.map(({ task, top, height }) => (
          <button
            key={task.id}
            type="button"
            onClick={() => setSelected(task.id)}
            className="absolute left-1 right-1 overflow-hidden rounded-md border border-[var(--ink-0)]/15 bg-[var(--bg-2)] px-2 py-1 text-left text-xs hover:bg-[var(--bg-3)]"
            style={{
              top,
              height,
              borderLeft: `3px solid ${task.color ?? "var(--ink-0)"}`,
            }}
          >
            <div className="truncate font-medium">{task.title}</div>
            <div className="text-[10px] text-[var(--ink-3)]">
              P{task.priority} · {task.status}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
