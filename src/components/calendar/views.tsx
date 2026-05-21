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
import { useRef, useState } from "react";
import { useLabels } from "@/db/hooks";
import { updateEvent } from "@/db/repositories/events";
import type { CalendarItem } from "@/types/domain";
import {
  buildLabelLookup,
  eventBlockStyle,
  resolveEventColor,
} from "./eventColor";
import { parentEventId } from "./expandRecurrence";
import { useCalendarItems } from "./useCalendarItems";

export interface ViewProps {
  cursor: number;
  rangeStart: number;
  rangeEnd: number;
  onCellClick: (start: number, end: number) => void;
  onItemClick: (kind: "task" | "event", id: string) => void;
}

const DAY_START_HOUR = 9;
const DAY_END_HOUR = 22;
const HOURS = DAY_END_HOUR - DAY_START_HOUR;
const TOTAL_MS = HOURS * 3600_000;
const SNAP_MS = 15 * 60_000;
const DAY_MS = 24 * 3600_000;

function startOfDayMs(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function snap(ms: number) {
  return Math.round(ms / SNAP_MS) * SNAP_MS;
}

function clampWithinWindow(ms: number, dayMs: number) {
  const lo = dayMs + DAY_START_HOUR * 3600_000;
  const hi = dayMs + DAY_END_HOUR * 3600_000;
  return Math.min(hi, Math.max(lo, ms));
}

function topPct(startMs: number, dayMs: number) {
  const offset = startMs - (dayMs + DAY_START_HOUR * 3600_000);
  return (Math.max(0, Math.min(TOTAL_MS, offset)) / TOTAL_MS) * 100;
}

function heightPct(startMs: number, endMs: number) {
  const dur = Math.max(SNAP_MS, endMs - startMs);
  return (Math.min(TOTAL_MS, dur) / TOTAL_MS) * 100;
}

type DragState =
  | {
      kind: "create";
      dayIdx: number;
      anchorMs: number;
      currentMs: number;
    }
  | {
      kind: "move";
      itemId: string;
      parentId: string;
      origStart: number;
      origEnd: number;
      origPointerMs: number;
      origPointerDayIdx: number;
      currentMs: number;
      currentDayIdx: number;
      moved: boolean;
    }
  | {
      kind: "resize";
      itemId: string;
      parentId: string;
      origStart: number;
      origEnd: number;
      origPointerMs: number;
      currentMs: number;
      moved: boolean;
    };

interface TimeGridProps {
  days: number[]; // array of startOfDayMs
  items: CalendarItem[];
  onCellRangeSelected: (start: number, end: number) => void;
  onItemClick: (kind: "task" | "event", id: string) => void;
  variant: "day" | "week";
}

function TimeGrid({
  days,
  items,
  onCellRangeSelected,
  onItemClick,
  variant,
}: TimeGridProps) {
  const labels = useLabels();
  const labelMap = buildLabelLookup(labels);
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const hours = Array.from({ length: HOURS }, (_, i) => DAY_START_HOUR + i);

  function pointToCoords(clientX: number, clientY: number) {
    const g = gridRef.current;
    if (!g) return null;
    const rect = g.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const colWidth = rect.width / days.length;
    const colIdx = Math.max(
      0,
      Math.min(days.length - 1, Math.floor(x / colWidth)),
    );
    const ratio = Math.max(0, Math.min(1, y / rect.height));
    const offsetMs = ratio * TOTAL_MS;
    const dayMs = days[colIdx];
    const ms = dayMs + DAY_START_HOUR * 3600_000 + offsetMs;
    return { colIdx, dayMs, ms };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const eventEl = target.closest<HTMLElement>("[data-event-block]");
    const resizeEl = target.closest<HTMLElement>("[data-resize-handle]");
    const p = pointToCoords(e.clientX, e.clientY);
    if (!p) return;

    if (eventEl && !resizeEl) {
      const kind = (eventEl.dataset.kind ?? "event") as "task" | "event";
      if (kind === "task") {
        onItemClick("task", eventEl.dataset.eventId ?? "");
        return;
      }
    }

    e.currentTarget.setPointerCapture(e.pointerId);

    if (resizeEl && eventEl) {
      const itemId = eventEl.dataset.eventId ?? "";
      const start = Number(eventEl.dataset.eventStart);
      const end = Number(eventEl.dataset.eventEnd);
      if (!itemId || Number.isNaN(start) || Number.isNaN(end)) return;
      setDrag({
        kind: "resize",
        itemId,
        parentId: parentEventId(itemId),
        origStart: start,
        origEnd: end,
        origPointerMs: p.ms,
        currentMs: p.ms,
        moved: false,
      });
      return;
    }

    if (eventEl) {
      const itemId = eventEl.dataset.eventId ?? "";
      const start = Number(eventEl.dataset.eventStart);
      const end = Number(eventEl.dataset.eventEnd);
      if (!itemId || Number.isNaN(start) || Number.isNaN(end)) return;
      setDrag({
        kind: "move",
        itemId,
        parentId: parentEventId(itemId),
        origStart: start,
        origEnd: end,
        origPointerMs: p.ms,
        origPointerDayIdx: p.colIdx,
        currentMs: p.ms,
        currentDayIdx: p.colIdx,
        moved: false,
      });
      return;
    }

    // Empty cell — start "create" drag.
    setDrag({
      kind: "create",
      dayIdx: p.colIdx,
      anchorMs: snap(p.ms),
      currentMs: snap(p.ms),
    });
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const p = pointToCoords(e.clientX, e.clientY);
    if (!p) return;
    if (drag.kind === "create") {
      setDrag({ ...drag, currentMs: snap(p.ms) });
    } else if (drag.kind === "move") {
      setDrag({
        ...drag,
        currentMs: p.ms,
        currentDayIdx: p.colIdx,
        moved: drag.moved || Math.abs(p.ms - drag.origPointerMs) > SNAP_MS / 2,
      });
    } else {
      const moved = drag.moved || Math.abs(p.ms - drag.origPointerMs) > 4_000;
      setDrag({ ...drag, currentMs: p.ms, moved });
    }
  }

  async function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (drag.kind === "create") {
      const a = Math.min(drag.anchorMs, drag.currentMs);
      const b = Math.max(drag.anchorMs, drag.currentMs);
      const dayMs = days[drag.dayIdx];
      const start = clampWithinWindow(a, dayMs);
      let end = clampWithinWindow(b, dayMs);
      if (end - start < SNAP_MS) end = start + 60 * 60_000; // click → 1h
      onCellRangeSelected(start, end);
    } else if (drag.kind === "move") {
      if (drag.moved) {
        const dayDelta = drag.currentDayIdx - drag.origPointerDayIdx;
        const msDelta = snap(drag.currentMs - drag.origPointerMs);
        const totalDelta = dayDelta * DAY_MS + msDelta;
        const newStart = drag.origStart + totalDelta;
        const newEnd = drag.origEnd + totalDelta;
        await updateEvent(drag.parentId, { start: newStart, end: newEnd });
      } else {
        onItemClick("event", drag.itemId);
      }
    } else {
      if (drag.moved) {
        const endDelta = snap(drag.currentMs - drag.origPointerMs);
        const newEnd = Math.max(
          drag.origStart + SNAP_MS,
          drag.origEnd + endDelta,
        );
        await updateEvent(drag.parentId, { end: newEnd });
      }
    }
    setDrag(null);
  }

  function onPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setDrag(null);
  }

  // Compute display offsets for the dragged item.
  function moveDelta(): { dayDelta: number; msDelta: number } | null {
    if (!drag || drag.kind !== "move") return null;
    const dayDelta = drag.currentDayIdx - drag.origPointerDayIdx;
    const msDelta = snap(drag.currentMs - drag.origPointerMs);
    return { dayDelta, msDelta };
  }
  function resizeDelta(): number {
    if (!drag || drag.kind !== "resize") return 0;
    return snap(drag.currentMs - drag.origPointerMs);
  }

  const md = moveDelta();
  const rd = resizeDelta();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-0)]">
      {variant === "week" && (
        <div className="grid shrink-0 grid-cols-[56px_repeat(7,1fr)] border-b border-[var(--line)] text-[11px]">
          <div />
          {days.map((d) => (
            <div
              key={d}
              className="border-l border-[var(--line)] px-2 py-1.5 text-[var(--ink-2)]"
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                {format(d, "EEE")}
              </div>
              <div className="font-mono">{format(d, "M/d")}</div>
            </div>
          ))}
        </div>
      )}
      <div className="grid min-h-0 flex-1 grid-cols-[56px_1fr]">
        <div className="flex flex-col text-[10px] text-[var(--ink-3)]">
          {hours.map((h) => (
            <div key={h} className="flex-1 px-2 pt-1 font-mono">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div
          ref={gridRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className="relative grid touch-none select-none"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Hour gridlines layer (under columns) */}
          {days.map((dayMs, colIdx) => {
            const dayItems = items.filter((it) => {
              const s =
                it.kind === "task" ? (it.data.start ?? 0) : it.data.start;
              return isSameDay(new Date(s), new Date(dayMs));
            });
            return (
              <div
                key={dayMs}
                className="relative flex flex-col border-l border-[var(--line)] first:border-l-0"
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="flex-1 border-b border-[var(--line)]"
                  />
                ))}
                {dayItems.map((it) => {
                  const start =
                    it.kind === "task" ? (it.data.start ?? 0) : it.data.start;
                  const end =
                    it.kind === "task"
                      ? (it.data.end ?? start + 30 * 60_000)
                      : it.data.end;
                  const isMove =
                    drag?.kind === "move" && drag.itemId === it.data.id;
                  const isResize =
                    drag?.kind === "resize" && drag.itemId === it.data.id;
                  const displayEnd = isResize
                    ? Math.max(start + SNAP_MS, end + rd)
                    : end;
                  return (
                    <EventBlock
                      key={`${it.kind}-${it.data.id}`}
                      item={it}
                      start={start}
                      end={displayEnd}
                      dayMs={dayMs}
                      color={resolveEventColor(it, labelMap)}
                      faded={isMove && drag.moved}
                      dragging={isMove || isResize}
                    />
                  );
                })}
                {/* "create" ghost */}
                {drag?.kind === "create" && drag.dayIdx === colIdx && (
                  <CreateGhost
                    dayMs={dayMs}
                    anchorMs={drag.anchorMs}
                    currentMs={drag.currentMs}
                  />
                )}
                {/* "move" ghost rendered in the destination column */}
                {drag?.kind === "move" &&
                  md &&
                  colIdx === drag.origPointerDayIdx + md.dayDelta &&
                  drag.moved && (
                    <MoveGhost
                      startMs={
                        drag.origStart + md.dayDelta * DAY_MS + md.msDelta
                      }
                      endMs={drag.origEnd + md.dayDelta * DAY_MS + md.msDelta}
                      dayMs={dayMs}
                    />
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventBlock({
  item,
  start,
  end,
  dayMs,
  color,
  faded = false,
  dragging = false,
}: {
  item: CalendarItem;
  start: number;
  end: number;
  dayMs: number;
  color: string | null;
  faded?: boolean;
  dragging?: boolean;
}) {
  const isEvent = item.kind === "event";
  const preActions = isEvent ? (item.data.preActions ?? []) : [];
  const preDone = preActions.filter((p) => p.done).length;
  return (
    <div
      data-event-block
      data-event-id={item.data.id}
      data-kind={item.kind}
      data-event-start={start}
      data-event-end={end}
      className="group absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1.5 text-left text-[10px]"
      style={{
        top: `${topPct(start, dayMs)}%`,
        height: `${heightPct(start, end)}%`,
        ...eventBlockStyle(color),
        opacity: faded ? 0.4 : 1,
        cursor: isEvent ? (dragging ? "grabbing" : "grab") : "pointer",
        zIndex: dragging ? 5 : 1,
      }}
    >
      <div className="flex items-center gap-1">
        <span className="min-w-0 flex-1 truncate font-medium">
          {item.data.title}
        </span>
        {preActions.length > 0 && (
          <span
            title={`사전 액션 ${preDone}/${preActions.length}`}
            className="shrink-0 rounded-full bg-[var(--bg-0)]/40 px-1.5 py-px text-[9px] tabular-nums text-[var(--ink-2)]"
          >
            ✓ {preDone}/{preActions.length}
          </span>
        )}
      </div>
      <div className="truncate text-[9px] text-[var(--ink-3)]">
        {format(start, "HH:mm")} – {format(end, "HH:mm")}
      </div>
      {isEvent && (
        <div
          data-resize-handle
          className="absolute bottom-0 right-0 h-2 w-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
          style={{
            background: color ?? "var(--ink-3)",
            borderTopLeftRadius: 2,
          }}
        />
      )}
    </div>
  );
}

function CreateGhost({
  dayMs,
  anchorMs,
  currentMs,
}: {
  dayMs: number;
  anchorMs: number;
  currentMs: number;
}) {
  const a = Math.min(anchorMs, currentMs);
  const b = Math.max(anchorMs, currentMs);
  const start = clampWithinWindow(a, dayMs);
  const end = clampWithinWindow(Math.max(b, a + SNAP_MS), dayMs);
  return (
    <div
      className="pointer-events-none absolute left-0.5 right-0.5 rounded border border-dashed border-[var(--ink-2)] bg-[var(--ink-0)]/10 px-1 text-[10px] font-medium text-[var(--ink-1)]"
      style={{
        top: `${topPct(start, dayMs)}%`,
        height: `${heightPct(start, end)}%`,
        zIndex: 6,
      }}
    >
      {format(start, "HH:mm")} – {format(end, "HH:mm")}
    </div>
  );
}

function MoveGhost({
  startMs,
  endMs,
  dayMs,
}: {
  startMs: number;
  endMs: number;
  dayMs: number;
}) {
  return (
    <div
      className="pointer-events-none absolute left-0.5 right-0.5 rounded border border-dashed border-[var(--ink-1)] bg-[var(--ink-0)]/10 px-1 text-[10px] font-medium text-[var(--ink-1)]"
      style={{
        top: `${topPct(startMs, dayMs)}%`,
        height: `${heightPct(startMs, endMs)}%`,
        zIndex: 6,
      }}
    >
      {format(startMs, "HH:mm")} – {format(endMs, "HH:mm")}
    </div>
  );
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
  return (
    <TimeGrid
      days={[day]}
      items={items}
      onCellRangeSelected={onCellClick}
      onItemClick={onItemClick}
      variant="day"
    />
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
  const days = Array.from({ length: 7 }, (_, i) =>
    startOfDayMs(addDays(weekStart, i).getTime()),
  );
  return (
    <TimeGrid
      days={days}
      items={items}
      onCellRangeSelected={onCellClick}
      onItemClick={onItemClick}
      variant="week"
    />
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
  const labels = useLabels();
  const labelMap = buildLabelLookup(labels);
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
                {dayItems.slice(0, 3).map((it) => {
                  const color = resolveEventColor(it, labelMap);
                  const pre =
                    it.kind === "event" ? (it.data.preActions ?? []) : [];
                  const preDone = pre.filter((p) => p.done).length;
                  return (
                    <button
                      key={`${it.kind}-${it.data.id}`}
                      type="button"
                      onClick={() => onItemClick(it.kind, it.data.id)}
                      className="flex items-center gap-1 truncate rounded-md px-2 py-1 text-left text-[10px]"
                      style={eventBlockStyle(color)}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {it.data.title}
                      </span>
                      {pre.length > 0 && (
                        <span
                          title={`사전 액션 ${preDone}/${pre.length}`}
                          className="shrink-0 rounded-full bg-[var(--bg-0)]/40 px-1 text-[9px] tabular-nums text-[var(--ink-2)]"
                        >
                          ✓ {preDone}/{pre.length}
                        </span>
                      )}
                    </button>
                  );
                })}
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
