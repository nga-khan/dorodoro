"use client";

import { type FormEvent, useCallback, useRef, useState } from "react";
import { FiCheckSquare } from "react-icons/fi";
import { createTask } from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { useCommand } from "@/lib/shortcuts/bus";
import { useAppStore } from "@/stores/app";
import { TaskListView } from "./TaskListView";
import { TaskTimelineView } from "./TaskTimelineView";

export function TaskBoard() {
  const view = useAppStore((s) => s.taskBoardView);
  const setView = useAppStore((s) => s.setTaskBoardView);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
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
        <div className="flex rounded-full border border-[var(--line)] p-0.5 text-xs">
          {(["list", "timeline"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                view === v
                  ? "bg-[var(--ink-0)] text-[var(--bg-0)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink-0)]",
              )}
            >
              {v === "list" ? "목록" : "타임라인"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="mb-3">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 Task — Enter로 추가"
          className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink-2)]"
        />
      </form>

      <div className="flex-1 overflow-auto">
        {view === "list" ? <TaskListView /> : <TaskTimelineView />}
      </div>
    </div>
  );
}
