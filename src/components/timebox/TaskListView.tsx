"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
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
import { useLabels, useTasks } from "@/db/hooks";
import { reorderTasks, toggleTaskStatus } from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/taskColors";
import { useAppStore } from "@/stores/app";
import type { Task } from "@/types/domain";

export function TaskListView() {
  const tasks = useTasks();
  const labels = useLabels();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    const next = arrayMove(ids, oldIndex, newIndex);
    await reorderTasks(next);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-[var(--ink-3)]">
        아직 Task가 없어요. Dump에서 승격하거나 직접 추가해보세요.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
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
    opacity: isDragging ? 0.6 : 1,
    borderLeft: `3px solid ${PRIORITY_TONE[task.priority].token}`,
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
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={onToggle}
        className="h-4 w-4"
        style={{ accentColor: statusTone.token }}
      />
      <button
        type="button"
        onClick={() => setSelected(task.id)}
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
          className="h-2.5 w-2.5 rounded-full border border-[var(--line-strong)]"
          style={{ background: task.color }}
        />
      )}
    </li>
  );
}
