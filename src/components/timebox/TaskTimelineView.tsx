"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { useTasksInRange } from "@/db/hooks";
import { updateTask } from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/stores/app";

const START_HOUR = 9;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_HEIGHT = 36; // px per hour

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export const TIMELINE_SLOT_PREFIX = "timeline-slot-";

export function TaskTimelineView({
  droppable = false,
}: {
  droppable?: boolean;
} = {}) {
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
            SLOT_HEIGHT,
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
      <div className="w-14 shrink-0 border-r border-[var(--line)] text-[10px] text-[var(--ink-3)]">
        {hourLabels.slice(0, -1).map((h) => (
          <div
            key={h}
            style={{ height: SLOT_HEIGHT }}
            className="flex items-center justify-center font-mono"
          >
            {`${String(h).padStart(2, "0")}:00`}
          </div>
        ))}
      </div>
      <div className="relative flex-1">
        {hourLabels
          .slice(0, -1)
          .map((h) =>
            droppable ? (
              <DroppableSlot key={h} hour={h} onClick={() => onCellClick(h)} />
            ) : (
              <button
                key={h}
                type="button"
                onClick={() => onCellClick(h)}
                style={{ height: SLOT_HEIGHT }}
                className="block w-full border-b border-[var(--line)] hover:bg-[var(--bg-1)]"
                aria-label={`${h}시 슬롯`}
              />
            ),
          )}
        {/* placement layer is rendered above slots */}
        {placements.map(({ task, top, height }) => (
          <DraggableTaskBlock
            key={task.id}
            id={task.id}
            top={top}
            height={height}
            color={task.color}
            title={task.title}
            priority={task.priority}
            status={task.status}
            onClick={() => setSelected(task.id)}
            draggable={droppable}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableTaskBlock({
  id,
  top,
  height,
  color,
  title,
  priority,
  status,
  onClick,
  draggable,
}: {
  id: string;
  top: number;
  height: number;
  color?: string;
  title: string;
  priority: number;
  status: string;
  onClick: () => void;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: !draggable });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      className="absolute inset-x-0 overflow-hidden rounded-md bg-[var(--bg-2)] px-2.5 py-1.5 text-left text-[10px] leading-tight hover:bg-[var(--bg-3)]"
      style={{
        top,
        height,
        background: color
          ? `color-mix(in srgb, ${color} 22%, var(--bg-0))`
          : "var(--bg-2)",
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: draggable ? (isDragging ? "grabbing" : "grab") : "pointer",
        touchAction: "none",
        zIndex: isDragging ? 5 : 1,
      }}
    >
      <div className="truncate font-medium">{title}</div>
      <div className="text-[9px] text-[var(--ink-3)]">
        P{priority} · {status}
      </div>
    </button>
  );
}

function DroppableSlot({
  hour,
  onClick,
}: {
  hour: number;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${TIMELINE_SLOT_PREFIX}${hour}`,
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      style={{ height: SLOT_HEIGHT }}
      className={cn(
        "block w-full border-b border-[var(--line)] transition-colors",
        isOver ? "bg-[var(--ink-0)]/10" : "hover:bg-[var(--bg-1)]",
      )}
      aria-label={`${hour}시 슬롯`}
    />
  );
}
