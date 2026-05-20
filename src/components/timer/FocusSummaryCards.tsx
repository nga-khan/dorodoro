"use client";

import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FiCalendar, FiClock, FiSun } from "react-icons/fi";
import { Sparkline } from "@/components/charts/MiniChart";
import { useSessionsInRange } from "@/db/hooks";
import type { PomodoroSession } from "@/types/domain";

interface Range {
  label: string;
  start: number;
  end: number;
  buckets: number; // number of inline-chart buckets to split the range into
  Icon: IconType;
}

function computeRanges(now: number): [Range, Range, Range] {
  const d = new Date(now);
  return [
    {
      label: "오늘",
      start: startOfDay(d).getTime(),
      end: endOfDay(d).getTime(),
      buckets: 24,
      Icon: FiSun,
    },
    {
      label: "이번 주",
      start: startOfWeek(d, { weekStartsOn: 1 }).getTime(),
      end: endOfWeek(d, { weekStartsOn: 1 }).getTime(),
      buckets: 7,
      Icon: FiCalendar,
    },
    {
      label: "이번 달",
      start: startOfMonth(d).getTime(),
      end: endOfMonth(d).getTime(),
      buckets: 30,
      Icon: FiClock,
    },
  ];
}

function bucketize(sessions: PomodoroSession[], range: Range): number[] {
  const out = new Array<number>(range.buckets).fill(0);
  const span = range.end - range.start;
  if (span <= 0) return out;
  for (const s of sessions) {
    if (s.phase !== "work") continue;
    const t = s.startedAt;
    if (t < range.start || t > range.end) continue;
    const bucket = Math.min(
      range.buckets - 1,
      Math.floor(((t - range.start) / span) * range.buckets),
    );
    const dur = Math.max(0, (s.endedAt ?? Date.now()) - s.startedAt);
    out[bucket] += dur / 60_000; // minutes
  }
  return out;
}

function focusStats(sessions: PomodoroSession[]) {
  let totalMs = 0;
  let count = 0;
  for (const s of sessions) {
    if (s.phase !== "work") continue;
    const end = s.endedAt ?? Date.now();
    totalMs += Math.max(0, end - s.startedAt);
    if (s.completed) count++;
  }
  return { totalMs, count };
}

function formatDuration(ms: number) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function FocusSummaryCards() {
  // Recompute ranges once per minute so day boundaries roll over.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const [today, week, month] = computeRanges(now);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <FocusCard range={today} />
      <div className="flex flex-col gap-1.5 px-1 text-[12px] text-[var(--ink-2)] sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-1">
        <FocusRow range={week} />
        <FocusRow range={month} />
      </div>
    </div>
  );
}

function FocusRow({ range }: { range: Range }) {
  const sessions = useSessionsInRange(range.start, range.end);
  const { totalMs, count } = focusStats(sessions);
  const { Icon } = range;
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden className="text-[12px] text-[var(--ink-3)]" />
      <span className="text-[var(--ink-3)]">{range.label} 집중시간</span>
      <span className="font-mono tabular-nums text-[var(--ink-0)]">
        {totalMs > 0 ? formatDuration(totalMs) : "0분"}
      </span>
      <span className="text-[var(--ink-3)]">· 완료 {count}세션</span>
    </span>
  );
}

function FocusCard({ range }: { range: Range }) {
  const sessions = useSessionsInRange(range.start, range.end);
  const { totalMs, count } = focusStats(sessions);
  const buckets = bucketize(sessions, range);
  const { Icon } = range;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        <Icon aria-hidden className="text-[11px]" />
        {range.label} 집중시간
      </span>
      <span className="font-mono text-xl tracking-tight text-[var(--ink-0)]">
        {totalMs > 0 ? formatDuration(totalMs) : "0분"}
      </span>
      <Sparkline
        values={buckets}
        width={180}
        height={28}
        color="var(--accent)"
        fill="var(--bg-2)"
        className="w-full"
      />
      <span className="text-[11px] text-[var(--ink-2)]">완료 {count}세션</span>
    </div>
  );
}
