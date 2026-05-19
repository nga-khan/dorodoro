"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FiCheckSquare, FiTrash2 } from "react-icons/fi";
import { LabelPicker } from "@/components/shell/LabelPicker";
import { useTasks } from "@/db/hooks";
import { deleteTask, updateTask } from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { useCommand } from "@/lib/shortcuts/bus";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/taskColors";
import { useAppStore } from "@/stores/app";
import type { Priority, Task, TaskStatus } from "@/types/domain";

const STATUS_OPTIONS: TaskStatus[] = ["todo", "doing", "done"];
const PRIORITY_OPTIONS: Priority[] = [1, 2, 3, 4];

export function TaskDetailDrawer() {
  const selectedId = useAppStore((s) => s.selectedTaskId);
  const setSelected = useAppStore((s) => s.setSelectedTaskId);
  const tasks = useTasks();
  const task = tasks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (!task) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [task, setSelected]);

  useCommand("delete-selected", () => {
    if (!task) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("이 Task를 삭제할까요?")
    )
      return;
    void deleteTask(task.id).then(() => setSelected(null));
  });

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-6 shadow-2xl"
          >
            <DrawerBody task={task} onClose={() => setSelected(null)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({ task, onClose }: { task: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
  }, [task.title, task.description]);

  const save = (patch: Partial<Task>) => updateTask(task.id, patch);

  const commitAndClose = async () => {
    const patch: Partial<Task> = {};
    if (title !== task.title) patch.title = title;
    if ((description || "") !== (task.description ?? ""))
      patch.description = description;
    if (Object.keys(patch).length > 0) await updateTask(task.id, patch);
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
          <FiCheckSquare aria-hidden className="text-[11px]" />
          Task
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-[var(--ink-3)] hover:text-[var(--ink-0)]"
        >
          ✕
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => save({ title })}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "Enter") {
            e.preventDefault();
            void commitAndClose();
          }
        }}
        className="w-full bg-transparent text-lg font-medium tracking-tight outline-none"
      />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="우선순위">
          <div className="flex w-full overflow-hidden rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] p-0.5">
            {PRIORITY_OPTIONS.map((p) => {
              const tone = PRIORITY_TONE[p];
              const selected = task.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => save({ priority: p })}
                  title={`${tone.short} · ${tone.label}`}
                  className={cn(
                    "flex-1 rounded-[5px] px-2 py-1.5 text-xs font-medium transition-colors",
                    !selected &&
                      "text-[var(--ink-2)] hover:text-[var(--ink-0)]",
                  )}
                  style={
                    selected
                      ? {
                          color: tone.token,
                          background: `color-mix(in oklab, ${tone.token} 18%, transparent)`,
                          boxShadow: `inset 0 0 0 1px ${tone.token}`,
                        }
                      : undefined
                  }
                >
                  {tone.short}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="상태">
          <div className="flex w-full overflow-hidden rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] p-0.5">
            {STATUS_OPTIONS.map((s) => {
              const tone = STATUS_TONE[s];
              const selected = task.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => save({ status: s })}
                  className={cn(
                    "flex-1 rounded-[5px] px-2 py-1.5 text-xs font-medium transition-colors",
                    !selected &&
                      "text-[var(--ink-2)] hover:text-[var(--ink-0)]",
                  )}
                  style={
                    selected
                      ? {
                          color: tone.token,
                          background: `color-mix(in oklab, ${tone.token} 18%, transparent)`,
                          boxShadow: `inset 0 0 0 1px ${tone.token}`,
                        }
                      : undefined
                  }
                >
                  {tone.label}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="색상">
          <input
            type="color"
            value={task.color ?? "#111111"}
            onChange={(e) => save({ color: e.target.value })}
            className="h-8 w-full rounded-md border border-[var(--line-strong)] bg-transparent"
          />
        </Field>
        <Field label="시작 시각">
          <input
            type="datetime-local"
            value={task.start ? toLocalDT(task.start) : ""}
            onChange={(e) =>
              save({
                start: e.target.value
                  ? new Date(e.target.value).getTime()
                  : undefined,
              })
            }
            className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5"
          />
        </Field>
      </div>

      <Field label="라벨">
        <LabelPicker
          selected={task.labelIds ?? []}
          onChange={(ids) => save({ labelIds: ids })}
        />
      </Field>

      <Field label="설명">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => save({ description })}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void commitAndClose();
            }
          }}
          rows={5}
          placeholder="⌘/Ctrl + Enter 로 저장 후 닫기"
          className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
        />
      </Field>

      <button
        type="button"
        onClick={async () => {
          await deleteTask(task.id);
          onClose();
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2.5 py-1.5 text-xs text-[var(--danger-ink)] hover:bg-[color-mix(in_oklab,var(--danger-bg)_70%,var(--danger)_30%)]"
      >
        <FiTrash2 aria-hidden />
        Task 삭제
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </span>
      {children}
    </div>
  );
}

function toLocalDT(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
