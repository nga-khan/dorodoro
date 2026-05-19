import {
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import type {
  PeriodReflection,
  PomodoroSession,
  ReflectionPeriod,
  Task,
} from "@/types/domain";

export type PeriodBucket = "weekly" | "monthly" | "yearly";

const SAT_TO_NUM: Record<string, number> = { low: 1, mid: 2, high: 3 };

export function anchorTitle(r: Pick<PeriodReflection, "period" | "anchor">) {
  if (r.period === "weekly") return `${format(r.anchor, "yyyy.MM.dd")} 주`;
  if (r.period === "monthly") return format(r.anchor, "yyyy.MM");
  return format(r.anchor, "yyyy");
}

export function periodBadge(p: ReflectionPeriod): string {
  if (p === "weekly") return "주간";
  if (p === "monthly") return "월간";
  return "년간";
}

interface BucketResult {
  values: number[];
  labels: string[];
}

export function reflectionCountSeries(
  reflections: PeriodReflection[],
  bucket: PeriodBucket,
  count = 12,
): BucketResult {
  const now = new Date();
  const buckets: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    if (bucket === "weekly")
      buckets.push(startOfWeek(subWeeks(now, i), { weekStartsOn: 1 }));
    else if (bucket === "monthly")
      buckets.push(startOfMonth(subMonths(now, i)));
    else buckets.push(startOfYear(subYears(now, i)));
  }
  const period: ReflectionPeriod =
    bucket === "weekly"
      ? "weekly"
      : bucket === "monthly"
        ? "monthly"
        : "yearly";
  const values = buckets.map((b) => {
    const next =
      bucket === "weekly"
        ? startOfWeek(subWeeks(b, -1), { weekStartsOn: 1 }).getTime()
        : bucket === "monthly"
          ? startOfMonth(subMonths(b, -1)).getTime()
          : startOfYear(subYears(b, -1)).getTime();
    return reflections.filter(
      (r) => r.period === period && r.anchor >= b.getTime() && r.anchor < next,
    ).length;
  });
  const labels = buckets.map((b) => {
    if (bucket === "weekly") return format(b, "MM/dd");
    if (bucket === "monthly") return format(b, "yyyy.MM");
    return format(b, "yyyy");
  });
  return { values, labels };
}

export function satisfactionSeries(reflections: PeriodReflection[]): number[] {
  return reflections
    .filter((r) => r.satisfaction != null)
    .slice()
    .sort((a, b) => a.anchor - b.anchor)
    .map((r) => SAT_TO_NUM[r.satisfaction as string] ?? 0);
}

export interface SessionStats {
  totalCompleted: number;
  totalFocusMin: number;
  daily: number[];
  dailyLabels: string[];
}

export function sessionStats(
  sessions: PomodoroSession[],
  days = 30,
): SessionStats {
  const completedWork = sessions.filter(
    (s) => s.completed && s.phase === "work",
  );
  const totalCompleted = completedWork.length;
  const totalFocusMin = Math.round(
    completedWork.reduce((sum, s) => sum + (s.plannedMs ?? 0), 0) / 60000,
  );

  const now = new Date();
  const daily: number[] = [];
  const dailyLabels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const s = startOfDay(d).getTime();
    const e = endOfDay(d).getTime();
    daily.push(
      completedWork.filter((x) => x.startedAt >= s && x.startedAt <= e).length,
    );
    dailyLabels.push(format(d, "MM/dd"));
  }
  return { totalCompleted, totalFocusMin, daily, dailyLabels };
}

export interface TaskStats {
  done: number;
  total: number;
  ratio: number;
  daily: number[];
  dailyLabels: string[];
}

export function taskStats(tasks: Task[], days = 30): TaskStats {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const ratio = total === 0 ? 0 : done / total;

  const now = new Date();
  const daily: number[] = [];
  const dailyLabels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const s = startOfDay(d).getTime();
    const e = endOfDay(d).getTime();
    daily.push(
      tasks.filter(
        (t) => t.status === "done" && t.updatedAt >= s && t.updatedAt <= e,
      ).length,
    );
    dailyLabels.push(format(d, "MM/dd"));
  }
  return { done, total, ratio, daily, dailyLabels };
}
