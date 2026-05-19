"use client";

import { useMemo, useState } from "react";
import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFlag,
  FiSmile,
} from "react-icons/fi";
import { Sparkline } from "@/components/charts/MiniChart";
import { useSessionsInRange, useTasksInRange } from "@/db/hooks";
import { useAppStore } from "@/stores/app";
import type { ReflectionPeriod } from "@/types/domain";
import { ReflectionModal } from "./ReflectionModal";
import { rangeFromCursor } from "./range";

const SAT_LABEL: Record<string, string> = {
  low: "낮음",
  mid: "보통",
  high: "높음",
};

const REFLECTION_VIEW: Partial<Record<string, ReflectionPeriod>> = {
  week: "weekly",
  month: "monthly",
  year: "yearly",
};

export function MetricsSidebar() {
  const cursor = useAppStore((s) => s.calendarCursor);
  const view = useAppStore((s) => s.calendarView);
  const { start, end } = rangeFromCursor(cursor, view);
  const tasks = useTasksInRange(start, end);
  const sessions = useSessionsInRange(start, end);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const reflectionPeriod = REFLECTION_VIEW[view];

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done").length;
    const focusMs = sessions
      .filter((s) => s.completed)
      .reduce((acc, s) => acc + ((s.endedAt ?? s.startedAt) - s.startedAt), 0);
    const priorities = [1, 2, 3, 4].map(
      (p) => tasks.filter((t) => t.priority === p).length,
    );
    const reflections = sessions.flatMap((s) =>
      s.reflection ? [s.reflection] : [],
    );
    const satCounts = { low: 0, mid: 0, high: 0 };
    for (const r of reflections) satCounts[r.satisfaction] += 1;
    const satTotal = reflections.length;
    // Daily focus minutes trend across the visible range (up to 31 buckets).
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.max(1, Math.min(31, Math.ceil((end - start) / dayMs)));
    const trend = new Array<number>(days).fill(0);
    for (const s of sessions) {
      if (s.phase !== "work") continue;
      const idx = Math.min(
        days - 1,
        Math.max(0, Math.floor((s.startedAt - start) / dayMs)),
      );
      const dur = Math.max(0, (s.endedAt ?? Date.now()) - s.startedAt);
      trend[idx] += dur / 60_000;
    }
    return {
      done,
      total: tasks.length,
      focusMin: Math.round(focusMs / 60_000),
      priorities,
      satCounts,
      satTotal,
      trend,
    };
  }, [tasks, sessions, start, end]);

  const PRIO_TOKENS = [
    "var(--prio-1)",
    "var(--prio-2)",
    "var(--prio-3)",
    "var(--prio-4)",
  ];

  return (
    <aside className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
      <div>
        <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
          <FiBarChart2 aria-hidden className="text-[11px]" />
          지표
        </div>
        <h3 className="text-base font-medium tracking-tight">기간 요약</h3>
      </div>

      <MetricCard
        Icon={FiCheckCircle}
        iconColor="var(--status-done)"
        label="완료한 Task"
        value={`${stats.done} / ${stats.total}`}
      />
      <MetricCard
        Icon={FiClock}
        iconColor="var(--accent)"
        label="총 집중 시간"
        value={`${stats.focusMin}분`}
        chart={
          <Sparkline
            values={stats.trend}
            width={120}
            height={28}
            color="var(--accent)"
            fill="var(--bg-2)"
            className="w-full"
          />
        }
      />

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-0)] p-3">
        <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
          <FiFlag aria-hidden className="text-[11px]" />
          우선순위 분포
        </div>
        <div className="flex items-end gap-1.5">
          {stats.priorities.map((c, i) => {
            const max = Math.max(...stats.priorities, 1);
            const h = Math.round((c / max) * 56);
            return (
              <div
                key={`p${i + 1}`}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${h}px`,
                    minHeight: 2,
                    background: PRIO_TOKENS[i],
                  }}
                />
                <span className="text-[10px] text-[var(--ink-3)]">
                  P{i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-0)] p-3">
        <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
          <FiSmile aria-hidden className="text-[11px]" />
          시간 만족도
        </div>
        {stats.satTotal === 0 ? (
          <div className="text-xs text-[var(--ink-3)]">
            아직 회고 기록이 없어요.
          </div>
        ) : (
          <div className="space-y-1.5 text-xs">
            {(["high", "mid", "low"] as const).map((k) => {
              const c = stats.satCounts[k];
              const pct = Math.round((c / stats.satTotal) * 100);
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-9 text-[var(--ink-2)]">
                    {SAT_LABEL[k]}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-2)]">
                    <div
                      className="h-full bg-[var(--ink-0)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[10px] text-[var(--ink-3)]">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reflectionPeriod && (
        <button
          type="button"
          onClick={() => setReflectionOpen(true)}
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2 text-xs text-[var(--ink-1)] hover:bg-[var(--bg-2)]"
        >
          <FiEdit3 aria-hidden />
          {reflectionPeriod === "weekly"
            ? "주간 회고 작성"
            : reflectionPeriod === "monthly"
              ? "월간 회고 작성"
              : "년간 회고 작성"}
        </button>
      )}

      {reflectionPeriod && (
        <ReflectionModal
          open={reflectionOpen}
          period={reflectionPeriod}
          anchor={start}
          onClose={() => setReflectionOpen(false)}
        />
      )}
    </aside>
  );
}

function MetricCard({
  Icon,
  iconColor,
  label,
  value,
  chart,
}: {
  Icon: React.ComponentType<{
    "aria-hidden"?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }>;
  iconColor: string;
  label: string;
  value: string;
  chart?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-0)] p-3">
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        <Icon
          aria-hidden
          className="text-[11px]"
          style={{ color: iconColor }}
        />
        {label}
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className="font-mono text-xl text-[var(--ink-0)]">{value}</span>
        {chart && <div className="max-w-[120px] shrink-0">{chart}</div>}
      </div>
    </div>
  );
}
