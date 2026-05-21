"use client";

import { AnimatePresence, motion } from "motion/react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { FiCalendar, FiCheck, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { LabelPicker } from "@/components/shell/LabelPicker";
import { getDB } from "@/db/dexie";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/db/repositories/events";
import { cn } from "@/lib/cn";
import type {
  CalendarEvent,
  PreAction,
  RecurrenceRule,
  Weekday,
} from "@/types/domain";

interface Props {
  open: boolean;
  initial: Partial<CalendarEvent> & { start: number; end: number };
  editingId: string | null;
  /** When set, the user opened the editor on a recurring instance; enables "이 일정만 제외". */
  occurrenceStart?: number | null;
  onClose: () => void;
}

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];
const FREQ_LABEL: Record<RecurrenceRule["freq"], string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
};
type EndKind = "never" | "until" | "count";

export function EventEditorModal({
  open,
  initial,
  editingId,
  occurrenceStart,
  onClose,
}: Props) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [startStr, setStartStr] = useState(toLocalDT(initial.start));
  const [endStr, setEndStr] = useState(toLocalDT(initial.end));
  const [description, setDescription] = useState(initial.description ?? "");
  const [color, setColor] = useState(initial.color ?? "#111111");
  const [labelIds, setLabelIds] = useState<string[]>(initial.labelIds ?? []);

  // Recurrence editor state.
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [freq, setFreq] = useState<RecurrenceRule["freq"]>("weekly");
  const [interval, setInterval] = useState(1);
  const [byweekday, setByweekday] = useState<Weekday[]>([]);
  const [endKind, setEndKind] = useState<EndKind>("never");
  const [untilStr, setUntilStr] = useState("");
  const [count, setCount] = useState(10);

  const [preActions, setPreActions] = useState<PreAction[]>(
    initial.preActions ?? [],
  );
  const [preDraft, setPreDraft] = useState("");

  // Hydrate state when the modal opens; also load rrule from DB if editing.
  useEffect(() => {
    if (!open) return;
    setTitle(initial.title ?? "");
    setStartStr(toLocalDT(initial.start));
    setEndStr(toLocalDT(initial.end));
    setDescription(initial.description ?? "");
    setColor(initial.color ?? "#111111");
    setLabelIds(initial.labelIds ?? []);
    setRecurrenceEnabled(false);
    setFreq("weekly");
    setInterval(1);
    setByweekday([]);
    setEndKind("never");
    setUntilStr("");
    setCount(10);
    setPreActions(initial.preActions ?? []);
    setPreDraft("");

    if (!editingId) return;
    let cancelled = false;
    void getDB()
      .events.get(editingId)
      .then((ev) => {
        if (cancelled || !ev) return;
        if (ev.labelIds) setLabelIds(ev.labelIds);
        if (ev.preActions) setPreActions(ev.preActions);
        if (!ev.rrule) return;
        const r = ev.rrule;
        setRecurrenceEnabled(true);
        setFreq(r.freq);
        setInterval(r.interval ?? 1);
        setByweekday(r.byweekday ?? []);
        if (r.until != null) {
          setEndKind("until");
          setUntilStr(toLocalDT(r.until));
        } else if (r.count != null) {
          setEndKind("count");
          setCount(r.count);
        } else {
          setEndKind("never");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    editingId,
    initial.title,
    initial.start,
    initial.end,
    initial.description,
    initial.color,
    initial.labelIds,
    initial.preActions,
  ]);

  const buildRrule = (): RecurrenceRule | undefined => {
    if (!recurrenceEnabled) return undefined;
    const r: RecurrenceRule = { freq, interval };
    if (freq === "weekly" && byweekday.length > 0) r.byweekday = [...byweekday];
    if (endKind === "until" && untilStr) r.until = new Date(untilStr).getTime();
    if (endKind === "count") r.count = Math.max(1, count);
    return r;
  };

  const save = async () => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const rrule = buildRrule();
    if (editingId) {
      await updateEvent(editingId, {
        title,
        start,
        end,
        description,
        color,
        labelIds,
        rrule,
        preActions,
      });
    } else {
      await createEvent({ title, start, end, description, color });
      // createEvent doesn't accept rrule/labelIds/preActions directly; patch after create if needed.
      if (rrule || labelIds.length > 0 || preActions.length > 0) {
        const all = await getDB().events.toArray();
        const created = all.find((e) => e.start === start && e.title === title);
        if (created) {
          await updateEvent(created.id, {
            ...(rrule ? { rrule } : {}),
            ...(labelIds.length > 0 ? { labelIds } : {}),
            ...(preActions.length > 0 ? { preActions } : {}),
          });
        }
      }
    }
    onClose();
  };

  const remove = async () => {
    if (editingId) {
      await deleteEvent(editingId);
      onClose();
    }
  };

  const excludeOccurrence = async () => {
    if (!editingId || occurrenceStart == null) return;
    const ev = await getDB().events.get(editingId);
    if (!ev) return;
    const next = new Set(ev.exDates ?? []);
    next.add(occurrenceStart);
    await updateEvent(editingId, { exDates: [...next] });
    onClose();
  };

  const isRecurring = recurrenceEnabled;
  const showExclude = !!editingId && occurrenceStart != null && isRecurring;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-6 shadow-[var(--shadow-card)]"
          >
            <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
              <FiCalendar aria-hidden className="text-[11px]" />
              일정 {editingId ? "편집" : "추가"}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="mb-4 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2 text-base outline-none focus:border-[var(--ink-2)]"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <DTField label="시작" value={startStr} onChange={setStartStr} />
              <DTField label="종료" value={endStr} onChange={setEndStr} />
            </div>
            <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-3 text-xs">
              <span className="text-[var(--ink-3)]">색상</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-16 rounded-md border border-[var(--line-strong)] bg-transparent"
              />
            </div>
            <div className="mt-3 text-xs">
              <span className="mb-1 block text-[var(--ink-3)]">라벨</span>
              <LabelPicker selected={labelIds} onChange={setLabelIds} />
            </div>

            <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg-1)] p-3 text-xs">
              <label className="flex items-center justify-between">
                <span className="text-[var(--ink-2)]">반복</span>
                <input
                  type="checkbox"
                  checked={recurrenceEnabled}
                  onChange={(e) => setRecurrenceEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[var(--ink-0)]"
                />
              </label>
              {recurrenceEnabled && (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                    <select
                      value={freq}
                      onChange={(e) =>
                        setFreq(e.target.value as RecurrenceRule["freq"])
                      }
                      className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1"
                      aria-label="반복 빈도"
                    >
                      {(["daily", "weekly", "monthly", "yearly"] as const).map(
                        (f) => (
                          <option key={f} value={f}>
                            {FREQ_LABEL[f]}
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={interval}
                      onChange={(e) =>
                        setInterval(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1"
                      aria-label="반복 간격"
                    />
                    <span className="text-[var(--ink-3)]">간격</span>
                  </div>

                  {freq === "weekly" && (
                    <div className="flex flex-wrap items-center gap-1">
                      {WEEKDAY_LABEL.map((wd, i) => {
                        const active = byweekday.includes(i as Weekday);
                        return (
                          <button
                            key={wd}
                            type="button"
                            onClick={() =>
                              setByweekday((prev) =>
                                active
                                  ? prev.filter((d) => d !== i)
                                  : [...prev, i as Weekday].sort(),
                              )
                            }
                            className={cn(
                              "h-7 w-7 rounded-full border text-[11px]",
                              active
                                ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
                                : "border-[var(--line-strong)] text-[var(--ink-2)] hover:bg-[var(--bg-0)]",
                            )}
                            aria-pressed={active}
                          >
                            {wd}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                      종료
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {(["never", "until", "count"] as const).map((k) => (
                        <label
                          key={k}
                          className="inline-flex items-center gap-1"
                        >
                          <input
                            type="radio"
                            name="endKind"
                            checked={endKind === k}
                            onChange={() => setEndKind(k)}
                            className="accent-[var(--ink-0)]"
                          />
                          <span>
                            {k === "never"
                              ? "없음"
                              : k === "until"
                                ? "날짜까지"
                                : "N회"}
                          </span>
                        </label>
                      ))}
                    </div>
                    {endKind === "until" && (
                      <input
                        type="datetime-local"
                        value={untilStr}
                        onChange={(e) => setUntilStr(e.target.value)}
                        className="mt-1 w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1.5"
                      />
                    )}
                    {endKind === "count" && (
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={count}
                        onChange={(e) =>
                          setCount(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="mt-1 w-24 rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1.5"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                사전 액션 · {preActions.length}
              </span>
              {preActions.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--line)] px-3 py-2 text-[11px] text-[var(--ink-3)]">
                  아직 없어요 — 아래에 추가해보세요.
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {preActions.map((pa) => (
                    <li
                      key={pa.id}
                      className="group flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPreActions((prev) =>
                            prev.map((x) =>
                              x.id === pa.id ? { ...x, done: !x.done } : x,
                            ),
                          )
                        }
                        aria-label={pa.done ? "완료 해제" : "완료"}
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                          pa.done
                            ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
                            : "border-[var(--line-strong)] text-transparent hover:border-[var(--ink-2)]",
                        )}
                      >
                        ✓
                      </button>
                      <input
                        value={pa.title}
                        onChange={(e) =>
                          setPreActions((prev) =>
                            prev.map((x) =>
                              x.id === pa.id
                                ? { ...x, title: e.target.value }
                                : x,
                            ),
                          )
                        }
                        className={cn(
                          "min-w-0 flex-1 bg-transparent text-xs outline-none",
                          pa.done && "text-[var(--ink-3)] line-through",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPreActions((prev) =>
                            prev.filter((x) => x.id !== pa.id),
                          )
                        }
                        aria-label="삭제"
                        className="rounded p-1 text-[var(--ink-4)] opacity-0 transition-opacity hover:text-[var(--danger-ink)] group-hover:opacity-100"
                      >
                        <FiX aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = preDraft.trim();
                  if (!v) return;
                  setPreActions((prev) => [
                    ...prev,
                    { id: nanoid(), title: v, done: false },
                  ]);
                  setPreDraft("");
                }}
                className="flex gap-1.5"
              >
                <input
                  value={preDraft}
                  onChange={(e) => setPreDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.nativeEvent.isComposing || e.keyCode === 229)
                    ) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  placeholder="사전 액션 추가 — Enter"
                  className="flex-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--ink-2)]"
                />
                <button
                  type="submit"
                  aria-label="추가"
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 text-xs text-[var(--ink-1)] hover:bg-[var(--bg-2)]"
                >
                  <FiPlus aria-hidden />
                </button>
              </form>
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 (선택)"
              rows={3}
              className="mt-3 w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
            />
            <div className="mt-5 flex items-center justify-between gap-2">
              <div className="flex flex-col items-start gap-1">
                {editingId && (
                  <button
                    type="button"
                    onClick={remove}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2.5 py-1.5 text-xs text-[var(--danger-ink)] hover:bg-[color-mix(in_oklab,var(--danger-bg)_70%,var(--danger)_30%)]"
                  >
                    <FiTrash2 aria-hidden />
                    {isRecurring ? "전체 삭제" : "삭제"}
                  </button>
                )}
                {showExclude && (
                  <button
                    type="button"
                    onClick={excludeOccurrence}
                    className="text-[10px] uppercase tracking-wider text-[var(--ink-3)] hover:text-[var(--ink-0)]"
                  >
                    이 일정만 제외
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
                >
                  <FiX aria-hidden />
                  취소
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--ink-0)] px-4 py-2 text-sm text-[var(--bg-0)] hover:opacity-90"
                >
                  <FiCheck aria-hidden />
                  저장
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DTField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </span>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5"
      />
    </div>
  );
}

function toLocalDT(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
