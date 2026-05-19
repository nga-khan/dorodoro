"use client";

import { PRIORITY_TONE, STATUS_TONE } from "@/lib/taskColors";
import type { Task } from "@/types/domain";

export function TaskDragGhost({ task }: { task: Task }) {
  const prio = PRIORITY_TONE[task.priority];
  const status = STATUS_TONE[task.status];
  return (
    <div
      className="pointer-events-none flex items-center gap-3 rounded-lg border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2 text-sm shadow-[var(--shadow-card,0_8px_24px_rgba(0,0,0,0.18))]"
      style={{ borderLeft: `3px solid ${prio.token}`, maxWidth: 360 }}
    >
      <span className="text-[var(--ink-4)]">⋮⋮</span>
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{task.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider">
          <span
            className="rounded-full px-1.5 py-0.5 font-medium"
            style={{
              color: prio.token,
              background: `color-mix(in oklab, ${prio.token} 16%, transparent)`,
            }}
          >
            {prio.short} · {prio.label}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{
              color: status.token,
              background: `color-mix(in oklab, ${status.token} 16%, transparent)`,
            }}
          >
            {status.label}
          </span>
        </div>
      </div>
      {task.color && (
        <span
          className="h-2.5 w-2.5 rounded-full border border-[var(--line-strong)]"
          style={{ background: task.color }}
        />
      )}
    </div>
  );
}
