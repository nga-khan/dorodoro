"use client";

import { useState } from "react";
import {
  MiniBars,
  ProgressRing,
  Sparkline,
} from "@/components/charts/MiniChart";
import { useSessions, useTasks } from "@/db/hooks";
import { cn } from "@/lib/cn";
import type { PeriodReflection } from "@/types/domain";
import {
  type PeriodBucket,
  reflectionCountSeries,
  satisfactionSeries,
  sessionStats,
  taskStats,
} from "./aggregations";

interface Props {
  reflections: PeriodReflection[];
}

const BUCKETS: { v: PeriodBucket; label: string }[] = [
  { v: "weekly", label: "주" },
  { v: "monthly", label: "월" },
  { v: "yearly", label: "년" },
];

export function MetricsDashboard({ reflections }: Props) {
  const sessions = useSessions();
  const tasks = useTasks();
  const [bucket, setBucket] = useState<PeriodBucket>("monthly");

  const reflectionSeries = reflectionCountSeries(reflections, bucket);
  const satSeries = satisfactionSeries(reflections);
  const sStat = sessionStats(sessions);
  const tStat = taskStats(tasks);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card title="회고 작성 추이">
        <div className="mb-2 flex gap-1">
          {BUCKETS.map((b) => (
            <button
              key={b.v}
              type="button"
              onClick={() => setBucket(b.v)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px]",
                bucket === b.v
                  ? "bg-[var(--ink-0)] text-[var(--bg-0)]"
                  : "text-[var(--ink-2)] hover:bg-[var(--bg-2)]",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <MiniBars
          values={reflectionSeries.values}
          labels={reflectionSeries.labels}
          height={56}
        />
      </Card>

      <Card title="만족도 추이">
        {satSeries.length === 0 ? (
          <EmptyHint>만족도 기록이 없습니다</EmptyHint>
        ) : (
          <>
            <Sparkline values={satSeries} width={240} height={56} />
            <div className="mt-1 flex justify-between text-[10px] text-[var(--ink-3)]">
              <span>낮음</span>
              <span>보통</span>
              <span>높음</span>
            </div>
          </>
        )}
      </Card>

      <Card title="포모도로 누계">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-2xl font-medium tracking-tight">
              {sStat.totalCompleted}
            </div>
            <div className="text-[10px] text-[var(--ink-3)]">완료 세션</div>
          </div>
          <div>
            <div className="text-2xl font-medium tracking-tight">
              {Math.floor(sStat.totalFocusMin / 60)}h {sStat.totalFocusMin % 60}
              m
            </div>
            <div className="text-[10px] text-[var(--ink-3)]">누적 집중</div>
          </div>
        </div>
        <Sparkline
          className="mt-2"
          values={sStat.daily}
          width={240}
          height={40}
        />
        <div className="mt-1 text-[10px] text-[var(--ink-3)]">최근 30일</div>
      </Card>

      <Card title="할 일 완료율">
        <div className="flex items-center gap-3">
          <ProgressRing
            value={tStat.done}
            max={tStat.total || 1}
            size={56}
            stroke={6}
          />
          <div>
            <div className="text-2xl font-medium tracking-tight">
              {Math.round(tStat.ratio * 100)}%
            </div>
            <div className="text-[10px] text-[var(--ink-3)]">
              {tStat.done} / {tStat.total}
            </div>
          </div>
        </div>
        <MiniBars className="mt-2" values={tStat.daily} height={36} />
        <div className="mt-1 text-[10px] text-[var(--ink-3)]">
          최근 30일 일별 완료
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div className="py-2 text-xs text-[var(--ink-3)]">{children}</div>;
}
