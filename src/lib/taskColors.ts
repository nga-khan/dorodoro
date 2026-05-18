import type { Priority, TaskStatus } from "@/types/domain";

export const PRIORITY_TONE: Record<
  Priority,
  { token: string; label: string; short: string }
> = {
  1: { token: "var(--prio-1)", label: "긴급", short: "P1" },
  2: { token: "var(--prio-2)", label: "높음", short: "P2" },
  3: { token: "var(--prio-3)", label: "보통", short: "P3" },
  4: { token: "var(--prio-4)", label: "낮음", short: "P4" },
};

export const STATUS_TONE: Record<TaskStatus, { token: string; label: string }> =
  {
    todo: { token: "var(--status-todo)", label: "대기" },
    doing: { token: "var(--status-doing)", label: "진행" },
    done: { token: "var(--status-done)", label: "완료" },
  };
