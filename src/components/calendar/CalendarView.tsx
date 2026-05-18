"use client";

import { addDays, addMonths, addYears, format } from "date-fns";
import { useState } from "react";
import { FiBarChart2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TaskDetailDrawer } from "@/components/timebox/TaskDetailDrawer";
import { useEvents, useTasks } from "@/db/hooks";
import { cn } from "@/lib/cn";
import { useCommand } from "@/lib/shortcuts/bus";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { type CalendarView as CalView, useAppStore } from "@/stores/app";
import { EventEditorModal } from "./EventEditorModal";
import { parentEventId } from "./expandRecurrence";
import { MetricsSidebar } from "./MetricsSidebar";
import { rangeFromCursor } from "./range";
import { DayView, MonthView, WeekView, YearView } from "./views";

const VIEWS: { key: CalView; label: string }[] = [
  { key: "day", label: "일" },
  { key: "week", label: "주" },
  { key: "month", label: "월" },
  { key: "year", label: "년" },
];

export function CalendarView() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const view = useAppStore((s) => s.calendarView);
  const setView = useAppStore((s) => s.setCalendarView);
  const cursor = useAppStore((s) => s.calendarCursor);
  const setCursor = useAppStore((s) => s.setCalendarCursor);
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId);

  const events = useEvents();
  useTasks();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInit, setEditorInit] = useState({
    start: Date.now(),
    end: Date.now() + 3600_000,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [occurrenceStart, setOccurrenceStart] = useState<number | null>(null);
  const [metricsOpen, setMetricsOpen] = useState(false);

  const { start, end } = rangeFromCursor(cursor, view);

  const goPrev = () => {
    if (view === "day") setCursor(addDays(new Date(cursor), -1).getTime());
    else if (view === "week")
      setCursor(addDays(new Date(cursor), -7).getTime());
    else if (view === "month")
      setCursor(addMonths(new Date(cursor), -1).getTime());
    else setCursor(addYears(new Date(cursor), -1).getTime());
  };
  const goNext = () => {
    if (view === "day") setCursor(addDays(new Date(cursor), 1).getTime());
    else if (view === "week") setCursor(addDays(new Date(cursor), 7).getTime());
    else if (view === "month")
      setCursor(addMonths(new Date(cursor), 1).getTime());
    else setCursor(addYears(new Date(cursor), 1).getTime());
  };

  const openEditor = (s: number, e: number, id: string | null = null) => {
    if (id) {
      const parentId = parentEventId(id);
      const ev = events.find((x) => x.id === parentId);
      const isOccurrence = parentId !== id;
      // For occurrences, parse the occurrence start from the synthetic id
      // so the editor shows the clicked instance's date.
      const occMs = isOccurrence ? Number(id.slice(parentId.length + 1)) : null;
      if (ev) {
        if (occMs != null && Number.isFinite(occMs)) {
          const dur = ev.end - ev.start;
          setEditorInit({ start: occMs, end: occMs + dur });
        } else {
          setEditorInit({ start: ev.start, end: ev.end });
        }
        setEditingId(parentId);
        setOccurrenceStart(occMs);
      } else {
        setEditorInit({ start: s, end: e });
        setEditingId(null);
        setOccurrenceStart(null);
      }
    } else {
      setEditorInit({ start: s, end: e });
      setEditingId(null);
      setOccurrenceStart(null);
    }
    setEditorOpen(true);
  };

  useCommand("open-event-editor", () => {
    const now = Date.now();
    const rounded = Math.ceil(now / (30 * 60_000)) * (30 * 60_000);
    openEditor(rounded, rounded + 60 * 60_000, null);
  });

  const onCellClick = (s: number, e: number) => openEditor(s, e, null);
  const onItemClick = (kind: "task" | "event", id: string) => {
    if (kind === "task") setSelectedTaskId(id);
    else openEditor(0, 0, id);
  };

  const headerLabel =
    view === "day"
      ? format(cursor, "yyyy. MM. dd")
      : view === "week"
        ? `${format(start, "MM/dd")} – ${format(end, "MM/dd")}`
        : view === "month"
          ? format(cursor, "yyyy. MM")
          : format(cursor, "yyyy");

  const viewProps = {
    cursor,
    rangeStart: start,
    rangeEnd: end,
    onCellClick,
    onItemClick,
  };

  return (
    <section
      className={cn("flex h-[calc(100vh-160px)] gap-3", isMobile && "flex-col")}
    >
      {!isMobile && (
        <div className="w-72 shrink-0">
          <MetricsSidebar />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-md border border-[var(--line)] px-2 py-1 text-sm hover:bg-[var(--bg-1)]"
              aria-label="이전"
            >
              <FiChevronLeft aria-hidden />
            </button>
            <span className="font-mono text-sm tracking-tight">
              {headerLabel}
            </span>
            <button
              type="button"
              onClick={goNext}
              className="rounded-md border border-[var(--line)] px-2 py-1 text-sm hover:bg-[var(--bg-1)]"
              aria-label="다음"
            >
              <FiChevronRight aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setCursor(Date.now())}
              className="ml-2 rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
            >
              오늘
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMetricsOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-3 py-1 text-xs hover:bg-[var(--bg-1)]"
              >
                <FiBarChart2 aria-hidden />
                지표
              </button>
            )}
            <div className="flex rounded-full border border-[var(--line)] p-0.5 text-xs">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setView(v.key)}
                  className={cn(
                    "rounded-full px-3 py-1 transition-colors",
                    view === v.key
                      ? "bg-[var(--ink-0)] text-[var(--bg-0)]"
                      : "text-[var(--ink-2)]",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {view === "day" && <DayView {...viewProps} />}
          {view === "week" && <WeekView {...viewProps} />}
          {view === "month" && <MonthView {...viewProps} />}
          {view === "year" && <YearView {...viewProps} />}
        </div>
      </div>

      {isMobile && metricsOpen && (
        <button
          type="button"
          aria-label="close metrics"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMetricsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-0)] p-4 text-left"
          >
            <MetricsSidebar />
          </div>
        </button>
      )}

      <EventEditorModal
        open={editorOpen}
        initial={editorInit}
        editingId={editingId}
        occurrenceStart={occurrenceStart}
        onClose={() => setEditorOpen(false)}
      />
      <TaskDetailDrawer />
    </section>
  );
}
