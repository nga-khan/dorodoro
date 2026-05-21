"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useLabels, useTasks } from "@/db/hooks";
import { reorderTasks, toggleTaskStatus } from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/taskColors";
import { useAppStore } from "@/stores/app";
import type { Task } from "@/types/domain";
import { TaskDragGhost } from "./TaskDragGhost";

export function TaskListView({
  externalDnd = false,
  showOnly = "active",
}: {
  externalDnd?: boolean;
  showOnly?: "active" | "done";
} = {}) {
  const allTasks = useTasks();
  const tasks =
    showOnly === "done"
      ? allTasks.filter((t) => t.status === "done" && t.parentId == null)
      : allTasks.filter((t) => t.status !== "done" && t.parentId == null);
  const labels = useLabels();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    await reorderTasks(next);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-[var(--ink-3)]">
        {showOnly === "done"
          ? "완료된 Task가 아직 없어요."
          : "아직 Task가 없어요. Dump에서 승격하거나 직접 추가해보세요."}
      </div>
    );
  }

  const body = (
    <SortableContext
      items={tasks.map((t) => t.id)}
      strategy={verticalListSortingStrategy}
    >
      <ul className="space-y-1.5">
        {tasks.map((t) => (
          <SortableRow
            key={t.id}
            task={t}
            labels={labels}
            onToggle={() => toggleTaskStatus(t.id)}
          />
        ))}
      </ul>
    </SortableContext>
  );

  if (externalDnd) return body;

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {body}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskDragGhost task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableRow({
  task,
  labels,
  onToggle,
}: {
  task: Task;
  labels: { id: string; name: string; color: string }[];
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const setSelected = useAppStore((s) => s.setSelectedTaskId);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const taskLabels = (task.labelIds ?? [])
    .map((id) => labels.find((l) => l.id === id))
    .filter((l): l is { id: string; name: string; color: string } => !!l);

  const statusTone = STATUS_TONE[task.status];
  const prioTone = PRIORITY_TONE[task.priority];

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg-0)] px-3 py-2",
        task.status === "done" && "opacity-60",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-[var(--ink-4)] hover:text-[var(--ink-2)]"
        aria-label="drag"
      >
        ⋮⋮
      </button>
      <button
        type="button"
        onClick={() => setSelected(task.id)}
        onDoubleClick={onToggle}
        className="flex-1 text-left text-sm"
      >
        <div
          className={
            task.status === "done" ? "line-through text-[var(--ink-3)]" : ""
          }
        >
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider">
          <span
            className="rounded-full px-1.5 py-0.5 font-medium"
            style={{
              color: prioTone.token,
              background: `color-mix(in oklab, ${prioTone.token} 16%, transparent)`,
            }}
          >
            {prioTone.short} · {prioTone.label}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{
              color: statusTone.token,
              background: `color-mix(in oklab, ${statusTone.token} 16%, transparent)`,
            }}
          >
            {statusTone.label}
          </span>
          {taskLabels.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-1.5 py-0.5 normal-case tracking-normal"
              style={{
                color: l.color,
                background: `color-mix(in oklab, ${l.color} 18%, transparent)`,
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
      </button>
      {task.color && (
        <span
          title="할당 색상"
          className="inline-block h-3 w-6 shrink-0 rounded-full"
          style={{
            background: `color-mix(in oklab, ${task.color} 24%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${task.color} 55%, transparent)`,
          }}
        />
      )}
    </li>
  );
}
