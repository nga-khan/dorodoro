"use client";

import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useCalendarItems } from "./useCalendarItems";

export interface ViewProps {
  cursor: number;
  rangeStart: number;
  rangeEnd: number;
  onCellClick: (start: number, end: number) => void;
  onItemClick: (kind: "task" | "event", id: string) => void;
}

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 24;
const HOUR_PX = 36;

function startOfDayMs(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function DayView({
  cursor,
  rangeStart,
  rangeEnd,
  onCellClick,
  onItemClick,
}: ViewProps) {
  const items = useCalendarItems(rangeStart, rangeEnd);
  const day = startOfDayMs(cursor);
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, i) => DAY_START_HOUR + i,
  );
  const placeable = items.filter((it) => {
    const s = it.kind === "task" ? (it.data.start ?? 0) : it.data.start;
    return (
      s >= day + DAY_START_HOUR * 3600_000 && s < day + DAY_END_HOUR * 3600_000
    );
  });

  return (
    <div className="relative flex h-full overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-0)]">
      <div className="w-14 shrink-0 border-r border-[var(--line)] text-[10px] text-[var(--ink-3)]">
        {hours.map((h) => (
          <div
            key={h}
            style={{ height: HOUR_PX }}
            className="px-2 pt-1 font-mono"
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>
      <div className="relative flex-1">
        {hours.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() =>
              onCellClick(day + h * 3600_000, day + h * 3600_000 + 3600_000)
            }
            style={{ height: HOUR_PX }}
            className="block w-full border-b border-[var(--line)] hover:bg-[var(--bg-1)]"
            aria-label={`${h}시`}
          />
        ))}
        {placeable.map((it) => {
          const start =
            it.kind === "task" ? (it.data.start ?? 0) : it.data.start;
          const end =
            it.kind === "task"
              ? (it.data.end ?? start + 30 * 60_000)
              : it.data.end;
          const top =
            ((start - (day + DAY_START_HOUR * 3600_000)) / 3600_000) * HOUR_PX;
          const height = Math.max(20, ((end - start) / 3600_000) * HOUR_PX);
          return (
            <button
              key={`${it.kind}-${it.data.id}`}
              type="button"
              onClick={() => onItemClick(it.kind, it.data.id)}
              className="absolute left-1 right-1 overflow-hidden rounded-md border border-[var(--ink-0)]/15 bg-[var(--bg-2)] px-2 py-1 text-left text-xs hover:bg-[var(--bg-3)]"
              style={{
                top,
                height,
                borderLeft: `3px solid ${it.data.color ?? "var(--ink-0)"}`,
              }}
            >
              <div className="truncate font-medium">{it.data.title}</div>
              <div className="text-[10px] text-[var(--ink-3)]">
                {format(start, "HH:mm")} - {format(end, "HH:mm")}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeekView({
  cursor,
  rangeStart,
  rangeEnd,
  onCellClick,
  onItemClick,
}: ViewProps) {
  const items = useCalendarItems(rangeStart, rangeEnd);
  const weekStart = startOfWeek(new Date(cursor), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, i) => DAY_START_HOUR + i,
  );

  return (
    <div className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-0)]">
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-[var(--line)] text-[11px]">
        <div />
        {days.map((d) => (
          <div
            key={d.getTime()}
            className="border-l border-[var(--line)] px-2 py-1.5 text-[var(--ink-2)]"
          >
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
              {format(d, "EEE")}
            </div>
            <div className="font-mono">{format(d, "M/d")}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[56px_repeat(7,1fr)] overflow-y-auto">
        <div className="text-[10px] text-[var(--ink-3)]">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_PX }}
              className="px-2 pt-1 font-mono"
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const dayMs = startOfDayMs(d.getTime());
          const dayItems = items.filter((it) => {
            const s = it.kind === "task" ? (it.data.start ?? 0) : it.data.start;
            return isSameDay(new Date(s), d);
          });
          return (
            <div
              key={d.getTime()}
              className="relative border-l border-[var(--line)]"
            >
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() =>
                    onCellClick(
                      dayMs + h * 3600_000,
                      dayMs + (h + 1) * 3600_000,
                    )
                  }
                  style={{ height: HOUR_PX }}
                  className="block w-full border-b border-[var(--line)] hover:bg-[var(--bg-1)]"
                  aria-label={`${format(d, "M/d")} ${h}시`}
                />
              ))}
              {dayItems.map((it) => {
                const start =
                  it.kind === "task" ? (it.data.start ?? 0) : it.data.start;
                const end =
                  it.kind === "task"
                    ? (it.data.end ?? start + 30 * 60_000)
                    : it.data.end;
                const top =
                  ((start - (dayMs + DAY_START_HOUR * 3600_000)) / 3600_000) *
                  HOUR_PX;
                const height = Math.max(
                  18,
                  ((end - start) / 3600_000) * HOUR_PX,
                );
                return (
                  <button
                    key={`${it.kind}-${it.data.id}`}
                    type="button"
                    onClick={() => onItemClick(it.kind, it.data.id)}
                    className="absolute left-0.5 right-0.5 overflow-hidden rounded bg-[var(--bg-2)] px-1 text-left text-[10px] hover:bg-[var(--bg-3)]"
                    style={{
                      top,
                      height,
                      borderLeft: `2px solid ${it.data.color ?? "var(--ink-0)"}`,
                    }}
                  >
                    <div className="truncate font-medium">{it.data.title}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MonthView({
  cursor,
  rangeStart,
  rangeEnd,
  onCellClick,
  onItemClick,
}: ViewProps) {
  const items = useCalendarItems(rangeStart, rangeEnd);
  const monthStart = startOfMonth(new Date(cursor));
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const cells = eachDayOfInterval({
    start: gridStart,
    end: addDays(gridStart, 41),
  });

  return (
    <div className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-0)]">
      <div className="grid grid-cols-7 border-b border-[var(--line)] text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
          <div key={d} className="px-2 py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 gap-px bg-[var(--line)]">
        {cells.map((d) => {
          const inMonth = isSameMonth(d, monthStart);
          const dayMs = startOfDayMs(d.getTime());
          const dayItems = items.filter((it) => {
            const s = it.kind === "task" ? (it.data.start ?? 0) : it.data.start;
            return isSameDay(new Date(s), d);
          });
          return (
            <div
              key={d.getTime()}
              className="relative flex flex-col overflow-hidden bg-[var(--bg-0)] p-1.5 text-xs"
            >
              <button
                type="button"
                onClick={() =>
                  onCellClick(dayMs + 9 * 3600_000, dayMs + 10 * 3600_000)
                }
                className={
                  inMonth
                    ? "text-left text-[var(--ink-1)]"
                    : "text-left text-[var(--ink-4)]"
                }
                aria-label={`${format(d, "yyyy-MM-dd")} 일정 추가`}
              >
                {format(d, "d")}
              </button>
              <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
                {dayItems.slice(0, 3).map((it) => (
                  <button
                    key={`${it.kind}-${it.data.id}`}
                    type="button"
                    onClick={() => onItemClick(it.kind, it.data.id)}
                    className="truncate rounded px-1 py-0.5 text-left text-[10px] hover:bg-[var(--bg-2)]"
                    style={{
                      borderLeft: `2px solid ${it.data.color ?? "var(--ink-0)"}`,
                    }}
                  >
                    {it.data.title}
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <span className="px-1 text-[9px] text-[var(--ink-3)]">
                    +{dayItems.length - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function YearView({
  cursor,
  rangeStart,
  rangeEnd,
  onCellClick,
}: ViewProps) {
  const items = useCalendarItems(rangeStart, rangeEnd);
  const yearStart = new Date(new Date(cursor).getFullYear(), 0, 1);
  const days = Array.from({ length: 365 }, (_, i) => addDays(yearStart, i));

  // Count completed tasks per day.
  const dayDoneCount = new Map<string, number>();
  for (const it of items) {
    if (it.kind === "task" && it.data.status === "done" && it.data.start) {
      const k = format(new Date(it.data.start), "yyyy-MM-dd");
      dayDoneCount.set(k, (dayDoneCount.get(k) ?? 0) + 1);
    }
  }
  const max = Math.max(1, ...Array.from(dayDoneCount.values()));

  return (
    <div className="h-full overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        {new Date(cursor).getFullYear()} · 완료 task heat-grid
      </div>
      <div className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-0.5">
        {days.map((d) => {
          const k = format(d, "yyyy-MM-dd");
          const c = dayDoneCount.get(k) ?? 0;
          const intensity = c === 0 ? 0 : Math.min(1, 0.2 + (c / max) * 0.8);
          return (
            <button
              key={k}
              type="button"
              onClick={() =>
                onCellClick(
                  startOfDayMs(d.getTime()) + 9 * 3600_000,
                  startOfDayMs(d.getTime()) + 10 * 3600_000,
                )
              }
              title={`${k} · ${c} done`}
              className="aspect-square rounded-[2px] border border-[var(--line)]"
              style={{
                background:
                  intensity === 0
                    ? "var(--bg-1)"
                    : `color-mix(in srgb, var(--ink-0) ${Math.round(intensity * 100)}%, var(--bg-0))`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
