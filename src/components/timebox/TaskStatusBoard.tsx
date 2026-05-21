"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiCheckCircle, FiCircle, FiPlayCircle } from "react-icons/fi";
import { useLabels, useTasks } from "@/db/hooks";
import { toggleTaskStatus } from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { dueTone, formatDueLabel } from "@/lib/dueDate";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/taskColors";
import { useAppStore } from "@/stores/app";
import type { Task, TaskStatus } from "@/types/domain";

export const STATUS_LANE_PREFIX = "status-lane-";

const LANES: { status: TaskStatus; label: string; Icon: typeof FiCircle }[] = [
  { status: "todo", label: "대기", Icon: FiCircle },
  { status: "doing", label: "진행", Icon: FiPlayCircle },
  { status: "done", label: "완료", Icon: FiCheckCircle },
];

export function TaskStatusBoard() {
  const allTasks = useTasks();
  const labels = useLabels();
  const rootTasks = allTasks.filter((t) => t.parentId == null);

  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-2 overflow-hidden">
      {LANES.map(({ status, label, Icon }) => {
        const tasks = rootTasks.filter((t) => t.status === status);
        return (
          <Lane
            key={status}
            status={status}
            label={label}
            Icon={Icon}
            tasks={tasks}
            labels={labels}
          />
        );
      })}
    </div>
  );
}

function Lane({
  status,
  label,
  Icon,
  tasks,
  labels,
}: {
  status: TaskStatus;
  label: string;
  Icon: typeof FiCircle;
  tasks: Task[];
  labels: { id: string; name: string; color: string }[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${STATUS_LANE_PREFIX}${status}`,
    data: { status },
  });
  const tone = STATUS_TONE[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-0 flex-col rounded-lg border bg-[var(--bg-1)] p-2 transition-colors",
        isOver
          ? "border-[var(--ink-2)] bg-[var(--bg-2)]"
          : "border-[var(--line)]",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
          <Icon
            aria-hidden
            style={{ color: tone.token }}
            className="text-[11px]"
          />
          {label}
        </div>
        <span className="font-mono text-[10px] text-[var(--ink-3)]">
          {tasks.length}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-1.5">
            {tasks.map((t) => (
              <LaneCard key={t.id} task={t} labels={labels} />
            ))}
          </ul>
        </SortableContext>
        {tasks.length === 0 && (
          <div className="m-1 flex flex-1 items-center justify-center rounded-md border border-dashed border-[var(--line)] px-2 py-6 text-center text-[10px] text-[var(--ink-3)]">
            여기로 드롭
          </div>
        )}
      </div>
    </div>
  );
}

function LaneCard({
  task,
  labels,
}: {
  task: Task;
  labels: { id: string; name: string; color: string }[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({ id: task.id });
  const setSelected = useAppStore((s) => s.setSelectedTaskId);
  const prio = PRIORITY_TONE[task.priority];
  const tone = dueTone(task);
  const dueColor =
    tone === "overdue"
      ? "var(--danger-ink)"
      : tone === "today"
        ? "var(--priority-p1)"
        : tone === "soon"
          ? "var(--priority-p2)"
          : "var(--ink-2)";
  const taskLabels = (task.labelIds ?? [])
    .map((id) => labels.find((l) => l.id === id))
    .filter((l): l is { id: string; name: string; color: string } => !!l);
  const showIndicator = isOver && active != null && active.id !== task.id;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="relative">
      {showIndicator && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-[var(--ink-0)]"
        />
      )}
      {/* biome-ignore lint/a11y/useSemanticElements: needs to contain a drag-handle button (button-in-button forbidden) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSelected(task.id)}
        onDoubleClick={() => void toggleTaskStatus(task.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected(task.id);
          }
        }}
        className={cn(
          "group flex cursor-pointer flex-col gap-1 rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-2 py-1.5 hover:bg-[var(--bg-1)]",
          task.status === "done" && "opacity-60",
        )}
        title={task.title}
      >
        <div className="flex items-start gap-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 cursor-grab touch-none text-[var(--ink-4)] hover:text-[var(--ink-2)]"
            aria-label="drag"
          >
            ⋮⋮
          </button>
          <span
            className={cn(
              "min-w-0 flex-1 text-left text-xs",
              task.status === "done" && "text-[var(--ink-3)] line-through",
            )}
          >
            <span className="line-clamp-2 break-words">{task.title}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 pl-5 text-[10px]">
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{
              color: prio.token,
              background: `color-mix(in oklab, ${prio.token} 18%, transparent)`,
            }}
          >
            {prio.short} · {prio.label}
          </span>
          {task.due && (
            <span
              className="rounded-full px-1.5 py-0.5"
              style={{
                color: dueColor,
                background: `color-mix(in oklab, ${dueColor} 18%, transparent)`,
              }}
              title={`마감 ${task.due}`}
            >
              {formatDueLabel(task.due)}
            </span>
          )}
          {task.rrule && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[var(--ink-2)]"
              style={{ background: "var(--bg-2)" }}
              title="반복"
            >
              ↻
            </span>
          )}
          {taskLabels.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="flex items-center">
                {taskLabels.map((l, i) => (
                  <span
                    key={l.id}
                    title={l.name}
                    className="inline-block h-3 w-3 rounded-full border border-[var(--bg-0)]"
                    style={{
                      background: l.color,
                      marginLeft: i === 0 ? 0 : -6,
                      zIndex: taskLabels.length - i,
                    }}
                  />
                ))}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5"
                style={{
                  color: taskLabels[0].color,
                  background: `color-mix(in oklab, ${taskLabels[0].color} 18%, transparent)`,
                }}
              >
                {taskLabels[0].name}
                {taskLabels.length > 1 && ` +${taskLabels.length - 1}`}
              </span>
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
