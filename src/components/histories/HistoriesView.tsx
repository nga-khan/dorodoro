"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import { ReflectionModal } from "@/components/calendar/ReflectionModal";
import { usePeriodReflections } from "@/db/hooks";
import { cn } from "@/lib/cn";
import type { PeriodReflection, ReflectionPeriod } from "@/types/domain";
import { anchorTitle, periodBadge } from "./aggregations";
import { MetricsDashboard } from "./MetricsDashboard";

type Filter = "all" | ReflectionPeriod;

const FILTERS: { v: Filter; label: string }[] = [
  { v: "all", label: "전체" },
  { v: "weekly", label: "주간" },
  { v: "monthly", label: "월간" },
  { v: "yearly", label: "년간" },
];

const SAT_DOT: Record<string, string> = {
  low: "bg-[var(--danger)]",
  mid: "bg-[var(--ink-2)]",
  high: "bg-[var(--success,#10b981)]",
};

export function HistoriesView() {
  const reflections = usePeriodReflections();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PeriodReflection | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reflections.filter((r) => {
      if (filter !== "all" && r.period !== filter) return false;
      if (!q) return true;
      const title = anchorTitle(r).toLowerCase();
      return (
        title.includes(q) ||
        (r.wentWell ?? "").toLowerCase().includes(q) ||
        (r.improvements ?? "").toLowerCase().includes(q) ||
        (r.nextActions ?? "").toLowerCase().includes(q)
      );
    });
  }, [reflections, filter, query]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:py-10">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-1)] hover:bg-[var(--bg-1)]"
          aria-label="홈으로"
        >
          <FiArrowLeft aria-hidden />
        </Link>
        <h1 className="text-lg font-medium tracking-tight">회고</h1>
        <span className="ml-auto text-xs text-[var(--ink-3)]">
          총 {reflections.length}개
        </span>
      </header>

      <MetricsDashboard reflections={reflections} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-1)] p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.v}
                type="button"
                onClick={() => setFilter(f.v)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition",
                  filter === f.v
                    ? "bg-[var(--ink-0)] text-[var(--bg-0)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--bg-2)]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="ml-auto inline-flex flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-1)] px-3 py-1.5 text-sm sm:max-w-xs">
            <FiSearch aria-hidden className="text-[var(--ink-3)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목 또는 내용 검색"
              className="w-full bg-transparent outline-none"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] py-12 text-center text-sm text-[var(--ink-3)]">
            {reflections.length === 0
              ? "아직 작성된 회고가 없습니다."
              : "조건에 맞는 회고가 없습니다."}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className="flex w-full flex-col gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg-1)] p-3 text-left transition hover:bg-[var(--bg-2)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5 text-[10px] tracking-wider text-[var(--ink-2)]">
                      {periodBadge(r.period)}
                    </span>
                    <span className="font-medium tracking-tight">
                      {anchorTitle(r)}
                    </span>
                    {r.satisfaction && (
                      <span
                        role="img"
                        aria-label={`만족도 ${r.satisfaction}`}
                        className={cn(
                          "ml-auto h-2 w-2 rounded-full",
                          SAT_DOT[r.satisfaction],
                        )}
                      />
                    )}
                  </div>
                  {(r.wentWell || r.improvements) && (
                    <p className="line-clamp-2 text-xs text-[var(--ink-2)]">
                      {r.wentWell || r.improvements}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReflectionModal
        open={editing !== null}
        period={editing?.period ?? "weekly"}
        anchor={editing?.anchor ?? 0}
        onClose={() => setEditing(null)}
      />
    </main>
  );
}
