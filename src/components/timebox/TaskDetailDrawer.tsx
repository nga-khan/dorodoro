"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FiCheckSquare, FiTrash2 } from "react-icons/fi";
import { LabelPicker } from "@/components/shell/LabelPicker";
import { useTasks } from "@/db/hooks";
import { deleteTask, updateTask } from "@/db/repositories/tasks";
import { useCommand } from "@/lib/shortcuts/bus";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useAppStore } from "@/stores/app";
import type { Priority, Task } from "@/types/domain";

export function TaskDetailDrawer() {
  const selectedId = useAppStore((s) => s.selectedTaskId);
  const setSelected = useAppStore((s) => s.setSelectedTaskId);
  const tasks = useTasks();
  const task = tasks.find((t) => t.id === selectedId) ?? null;
  const isMobile = useMediaQuery("(max-width: 768px)");

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
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.aside
            onClick={(e) => e.stopPropagation()}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={
              isMobile
                ? "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-0)] p-5"
                : "absolute inset-y-0 right-0 w-[420px] overflow-y-auto border-l border-[var(--line)] bg-[var(--bg-0)] p-6"
            }
          >
            <DrawerBody task={task} onClose={() => setSelected(null)} />
          </motion.aside>
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
        className="w-full bg-transparent text-lg font-medium tracking-tight outline-none"
      />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="우선순위">
          <select
            value={task.priority}
            onChange={(e) =>
              save({ priority: Number(e.target.value) as Priority })
            }
            className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5"
          >
            {[1, 2, 3, 4].map((p) => (
              <option key={p} value={p}>
                P{p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="상태">
          <select
            value={task.status}
            onChange={(e) => save({ status: e.target.value as Task["status"] })}
            className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5"
          >
            <option value="todo">대기</option>
            <option value="doing">진행</option>
            <option value="done">완료</option>
          </select>
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
          rows={5}
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
