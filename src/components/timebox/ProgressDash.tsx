"use client";

import { useMemo } from "react";
import type { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCircle,
  FiClock,
  FiPlayCircle,
} from "react-icons/fi";
import { ProgressRing, Sparkline } from "@/components/charts/MiniChart";
import { useSessionsInRange, useTasks } from "@/db/hooks";
import { isOverdue } from "@/lib/dueDate";

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function ProgressDash() {
  const tasks = useTasks();
  const dayStart = startOfDay();
  const sessions = useSessionsInRange(dayStart, dayStart + 24 * 60 * 60 * 1000);

  const counts = useMemo(() => {
    const todo = tasks.filter((t) => t.status === "todo").length;
    const doing = tasks.filter((t) => t.status === "doing").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    const total = tasks.length || 1;
    return {
      todo,
      doing,
      done,
      overdue,
      total: tasks.length,
      ratio: done / total,
    };
  }, [tasks]);

  const focus = useMemo(() => {
    const completed = sessions.filter((s) => s.completed);
    const totalMs = completed.reduce(
      (acc, s) => acc + ((s.endedAt ?? s.startedAt) - s.startedAt),
      0,
    );
    const minutes = Math.round(totalMs / 60_000);
    // Hourly buckets of focus minutes for sparkline.
    const buckets = new Array(24).fill(0);
    for (const s of sessions) {
      if (s.phase !== "work") continue;
      const d = new Date(s.startedAt);
      const hour = d.getHours();
      const dur = Math.max(0, (s.endedAt ?? Date.now()) - s.startedAt);
      buckets[hour] += dur / 60_000;
    }
    return { count: completed.length, minutes, buckets };
  }, [sessions]);

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
      {counts.overdue > 0 && (
        <output className="inline-flex items-center gap-2 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger-ink)]">
          <FiAlertTriangle aria-hidden />
          <span>
            마감 지난 Task{" "}
            <span className="font-mono font-medium">{counts.overdue}</span>건
          </span>
        </output>
      )}
      <div className="grid flex-1 grid-cols-2 gap-3">
        <Card
          Icon={FiCircle}
          iconColor="var(--status-todo)"
          label="대기"
          value={counts.todo}
        />
        <Card
          Icon={FiPlayCircle}
          iconColor="var(--status-doing)"
          label="진행"
          value={counts.doing}
        />
        <Card
          Icon={FiCheckCircle}
          iconColor="var(--status-done)"
          label="완료"
          value={counts.done}
          sub={`${Math.round(counts.ratio * 100)}%`}
          chart={
            <ProgressRing
              value={counts.done}
              max={counts.total || 1}
              size={36}
              stroke={4}
              color="var(--status-done)"
            />
          }
        />
        <Card
          Icon={FiClock}
          iconColor="var(--accent)"
          label="오늘 집중"
          value={`${focus.minutes}m`}
          sub={`${focus.count}세션`}
          chart={
            <Sparkline
              values={focus.buckets}
              width={70}
              height={28}
              color="var(--accent)"
              fill="var(--bg-2)"
              className="block"
            />
          }
        />
      </div>
    </div>
  );
}

function Card({
  Icon,
  iconColor,
  label,
  value,
  sub,
  chart,
}: {
  Icon: IconType;
  iconColor: string;
  label: string;
  value: number | string;
  sub?: string;
  chart?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--bg-0)] p-3">
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        <Icon
          aria-hidden
          className="text-[12px]"
          style={{ color: iconColor }}
        />
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl text-[var(--ink-0)]">
            {value}
          </span>
          {sub && (
            <span className="text-[10px] text-[var(--ink-3)]">{sub}</span>
          )}
        </div>
        {chart && <div className="shrink-0">{chart}</div>}
      </div>
    </div>
  );
}
