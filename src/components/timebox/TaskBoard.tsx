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
import { arrayMove } from "@dnd-kit/sortable";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { FiCalendar, FiCheckSquare, FiList } from "react-icons/fi";
import { useTasks } from "@/db/hooks";
import { createTask, reorderTasks, updateTask } from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { useCommand } from "@/lib/shortcuts/bus";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useAppStore } from "@/stores/app";
import { TaskDragGhost } from "./TaskDragGhost";
import { TaskListView } from "./TaskListView";
import { TaskTimelineView, TIMELINE_SLOT_PREFIX } from "./TaskTimelineView";

const SLOT_MIN = 30;

function todayHourMs(hour: number): { start: number; end: number } {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dayStart = d.getTime();
  const start = dayStart + hour * 60 * 60 * 1000;
  const end = start + SLOT_MIN * 60_000;
  return { start, end };
}

export function TaskBoard() {
  const view = useAppStore((s) => s.taskBoardView);
  const setView = useAppStore((s) => s.setTaskBoardView);
  const [title, setTitle] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const tasks = useTasks();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  useCommand(
    "focus-new-task",
    useCallback(() => inputRef.current?.focus(), []),
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = title.trim();
    if (!v) return;
    setTitle("");
    await createTask({ title: v });
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveDragId(String(e.active.id));
  };
  const onDragCancel = () => setActiveDragId(null);

  const onCombinedDragEnd = async (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    const activeId = String(active.id);
    if (overId.startsWith(TIMELINE_SLOT_PREFIX)) {
      const hour = Number(overId.slice(TIMELINE_SLOT_PREFIX.length));
      if (Number.isFinite(hour)) {
        const { start, end } = todayHourMs(hour);
        await updateTask(activeId, { start, end });
      }
      return;
    }
    if (activeId === overId) return;
    const ids = tasks.map((t) => t.id);
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;
    await reorderTasks(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
            <FiCheckSquare aria-hidden className="text-[11px]" />
            Tasks · 오늘
          </div>
          <h3 className="text-base font-medium tracking-tight">
            우선순위 보드
          </h3>
        </div>
        {!isDesktop && (
          <div className="flex rounded-full border border-[var(--line)] p-0.5 text-xs">
            {(
              [
                { key: "list", label: "목록", Icon: FiList },
                { key: "timeline", label: "타임라인", Icon: FiCalendar },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors",
                  view === key
                    ? "bg-[var(--ink-0)] text-[var(--bg-0)]"
                    : "text-[var(--ink-2)] hover:text-[var(--ink-0)]",
                )}
              >
                <Icon aria-hidden />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mb-3">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.nativeEvent.isComposing || e.keyCode === 229)
            ) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          placeholder="새 Task — Enter로 추가"
          className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink-2)]"
        />
      </form>

      {isDesktop ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onCombinedDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden">
            <div className="flex min-h-0 flex-col overflow-auto">
              <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
                <FiList aria-hidden />
                목록
              </div>
              <TaskListView externalDnd />
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden">
              <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
                <FiCalendar aria-hidden />
                타임라인 · 드롭해서 시간 배정
              </div>
              <div className="flex-1 overflow-hidden">
                <TaskTimelineView droppable />
              </div>
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeDragId
              ? (() => {
                  const t = tasks.find((x) => x.id === activeDragId);
                  return t ? <TaskDragGhost task={t} /> : null;
                })()
              : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 overflow-auto">
          {view === "list" ? <TaskListView /> : <TaskTimelineView />}
        </div>
      )}
    </div>
  );
}
