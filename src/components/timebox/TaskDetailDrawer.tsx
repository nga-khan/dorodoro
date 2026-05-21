"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckSquare,
  FiInbox,
  FiPlus,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { LabelPicker } from "@/components/shell/LabelPicker";
import { useSessionsForTask, useSubtasks, useTasks } from "@/db/hooks";
import { demoteTaskToDump } from "@/db/repositories/dumpItems";
import {
  createTask,
  deleteTask,
  toggleTaskStatus,
  updateTask,
} from "@/db/repositories/tasks";
import { cn } from "@/lib/cn";
import { dateKey, dueTone, formatDueLabel } from "@/lib/dueDate";
import { useCommand } from "@/lib/shortcuts/bus";
import { PRIORITY_TONE, STATUS_TONE } from "@/lib/taskColors";
import { useAppStore } from "@/stores/app";
import type {
  Priority,
  RecurrenceRule,
  Satisfaction,
  Task,
  TaskReflection,
  TaskStatus,
  Weekday,
} from "@/types/domain";

const STATUS_OPTIONS: TaskStatus[] = ["todo", "doing", "done"];
const PRIORITY_OPTIONS: Priority[] = [1, 2, 3, 4];
const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];
const FREQ_LABEL: Record<RecurrenceRule["freq"], string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
};

export function TaskDetailDrawer() {
  const selectedId = useAppStore((s) => s.selectedTaskId);
  const setSelected = useAppStore((s) => s.setSelectedTaskId);
  const tasks = useTasks();
  const task = tasks.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    if (!task) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [task, setSelected]);

  useCommand("delete-selected", () => {
    if (!task) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("이 Task를 삭제할까요?")
    )
      return;
    void deleteTask(task.id).then(() => setSelected(null));
  });

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-6 shadow-2xl"
          >
            <DrawerBody task={task} onClose={() => setSelected(null)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({ task, onClose }: { task: Task; onClose: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const setSelected = useAppStore((s) => s.setSelectedTaskId);
  const allTasks = useTasks();
  const parentTask = task.parentId
    ? (allTasks.find((t) => t.id === task.parentId) ?? null)
    : null;
  const isSubtask = !!task.parentId;

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
  }, [task.title, task.description]);

  const save = (patch: Partial<Task>) => updateTask(task.id, patch);

  const commitAndClose = async () => {
    const patch: Partial<Task> = {};
    if (title !== task.title) patch.title = title;
    if ((description || "") !== (task.description ?? ""))
      patch.description = description;
    if (Object.keys(patch).length > 0) await updateTask(task.id, patch);
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        {parentTask ? (
          <button
            type="button"
            onClick={() => setSelected(parentTask.id)}
            className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)] hover:text-[var(--ink-0)]"
            title={parentTask.title}
          >
            <FiArrowLeft aria-hidden className="shrink-0 text-[12px]" />
            <span className="truncate">{parentTask.title}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
            <FiCheckSquare aria-hidden className="text-[11px]" />
            Task
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-[var(--ink-3)] hover:text-[var(--ink-0)]"
        >
          ✕
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => save({ title })}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === "Enter") {
            e.preventDefault();
            void commitAndClose();
          }
        }}
        className="w-full bg-transparent text-lg font-medium tracking-tight outline-none"
      />

      <Field label="설명">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => save({ description })}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void commitAndClose();
            }
          }}
          rows={5}
          placeholder="⌘/Ctrl + Enter 로 저장 후 닫기"
          className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
        />
      </Field>

      {!isSubtask && <SubtaskSection parentId={task.id} />}

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="우선순위">
          <div className="flex w-full overflow-hidden rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] p-0.5">
            {PRIORITY_OPTIONS.map((p) => {
              const tone = PRIORITY_TONE[p];
              const selected = task.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => save({ priority: p })}
                  title={`${tone.short} · ${tone.label}`}
                  className={cn(
                    "flex-1 rounded-[5px] px-2 py-1.5 text-xs font-medium transition-colors",
                    !selected &&
                      "text-[var(--ink-2)] hover:text-[var(--ink-0)]",
                  )}
                  style={
                    selected
                      ? {
                          color: tone.token,
                          background: `color-mix(in oklab, ${tone.token} 18%, transparent)`,
                          boxShadow: `inset 0 0 0 1px ${tone.token}`,
                        }
                      : undefined
                  }
                >
                  {tone.short}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="상태">
          <div className="flex w-full overflow-hidden rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] p-0.5">
            {STATUS_OPTIONS.map((s) => {
              const tone = STATUS_TONE[s];
              const selected = task.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => save({ status: s })}
                  className={cn(
                    "flex-1 rounded-[5px] px-2 py-1.5 text-xs font-medium transition-colors",
                    !selected &&
                      "text-[var(--ink-2)] hover:text-[var(--ink-0)]",
                  )}
                  style={
                    selected
                      ? {
                          color: tone.token,
                          background: `color-mix(in oklab, ${tone.token} 18%, transparent)`,
                          boxShadow: `inset 0 0 0 1px ${tone.token}`,
                        }
                      : undefined
                  }
                >
                  {tone.label}
                </button>
              );
            })}
          </div>
        </Field>
        <div className="col-span-2">
          <Field label="마감일">
            <DueField task={task} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="예상 소요시간">
            <EstimateField task={task} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="시작 시각">
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="datetime-local"
                value={task.start ? toLocalDT(task.start) : ""}
                onChange={(e) =>
                  save({
                    start: e.target.value
                      ? new Date(e.target.value).getTime()
                      : undefined,
                  })
                }
                className="min-w-0 flex-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5"
              />
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { label: "지금", offset: 0 },
                    { label: "+1h", offset: 60 * 60_000 },
                    { label: "+4h", offset: 4 * 60 * 60_000 },
                  ] as const
                ).map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => save({ start: Date.now() + q.offset })}
                    className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-0)]"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </div>
      </div>

      <Field label="라벨">
        <LabelPicker
          selected={task.labelIds ?? []}
          onChange={(ids) => save({ labelIds: ids })}
        />
      </Field>

      <RecurrenceField task={task} />

      {task.status === "done" && <ReflectionSection task={task} />}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (
                typeof window !== "undefined" &&
                !window.confirm("이 Task를 삭제할까요?")
              )
                return;
              await deleteTask(task.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2.5 py-1.5 text-xs text-[var(--danger-ink)] hover:bg-[color-mix(in_oklab,var(--danger-bg)_70%,var(--danger)_30%)]"
          >
            <FiTrash2 aria-hidden />
            Task 삭제
          </button>
          <button
            type="button"
            onClick={async () => {
              if (
                typeof window !== "undefined" &&
                !window.confirm(
                  "이 Task를 Dump로 되돌릴까요? 일정·라벨 등 메타데이터는 사라집니다.",
                )
              )
                return;
              await demoteTaskToDump(task.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2.5 py-1.5 text-xs text-[var(--ink-1)] hover:bg-[var(--bg-2)]"
          >
            <FiInbox aria-hidden />
            다시 Dump로
          </button>
        </div>
        <button
          type="button"
          onClick={() => void commitAndClose()}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-0)] px-3 py-1.5 text-xs text-[var(--bg-0)] hover:opacity-90"
        >
          <FiSave aria-hidden />
          저장
        </button>
      </div>
    </div>
  );
}

const DUE_TONE_STYLE: Record<
  "overdue" | "today" | "soon" | "future",
  { color: string; bg: string }
> = {
  overdue: { color: "var(--danger-ink)", bg: "var(--danger-bg)" },
  today: { color: "var(--priority-p1)", bg: "var(--bg-2)" },
  soon: { color: "var(--priority-p2)", bg: "var(--bg-2)" },
  future: { color: "var(--ink-2)", bg: "var(--bg-2)" },
};

function DueField({ task }: { task: Task }) {
  const tone = dueTone(task);
  const save = (patch: Partial<Task>) => updateTask(task.id, patch);
  const setRelative = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    void save({ due: dateKey(d) });
  };
  const style = tone !== "none" ? DUE_TONE_STYLE[tone] : null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="date"
        value={task.due ?? ""}
        onChange={(e) => save({ due: e.target.value || undefined })}
        className="min-w-0 flex-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5"
      />
      <div className="flex flex-wrap gap-1">
        {(
          [
            { label: "오늘", days: 0 },
            { label: "내일", days: 1 },
            { label: "+3d", days: 3 },
            { label: "+7d", days: 7 },
          ] as const
        ).map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => setRelative(q.days)}
            className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-0)]"
          >
            {q.label}
          </button>
        ))}
        {task.due && (
          <button
            type="button"
            onClick={() => save({ due: undefined })}
            className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-3)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-0)]"
          >
            지우기
          </button>
        )}
      </div>
      {task.due && style && (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            color: style.color,
            background: `color-mix(in oklab, ${style.color} 18%, transparent)`,
          }}
        >
          {formatDueLabel(task.due)}
        </span>
      )}
    </div>
  );
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

function EstimateField({ task }: { task: Task }) {
  const sessions = useSessionsForTask(task.id);
  const actualMin = Math.round(
    sessions
      .filter((s) => s.phase === "work" && s.completed)
      .reduce((acc, s) => acc + ((s.endedAt ?? s.startedAt) - s.startedAt), 0) /
      60_000,
  );
  const save = (estimateMin: number | undefined) =>
    updateTask(task.id, { estimateMin });
  const [draft, setDraft] = useState<string>(
    task.estimateMin != null ? String(task.estimateMin) : "",
  );
  useEffect(() => {
    setDraft(task.estimateMin != null ? String(task.estimateMin) : "");
  }, [task.estimateMin]);

  const commit = () => {
    const v = draft.trim();
    if (v === "") {
      if (task.estimateMin != null) void save(undefined);
      return;
    }
    const n = Math.max(0, Math.floor(Number(v)));
    if (Number.isNaN(n)) return;
    if (n !== task.estimateMin) void save(n);
  };

  const est = task.estimateMin;
  const ratio = est && est > 0 ? actualMin / est : 0;
  const overBudget = est != null && est > 0 && actualMin > est;
  const tone = overBudget
    ? "var(--danger-ink)"
    : ratio >= 0.8
      ? "var(--priority-p2)"
      : "var(--ink-2)";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="inline-flex min-w-0 flex-1 items-center gap-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5">
        <input
          type="number"
          min={0}
          step={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="—"
          className="min-w-0 flex-1 bg-transparent outline-none"
        />
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
          분
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {([15, 30, 60, 90] as const).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => save(q)}
            className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-0)]"
          >
            {q < 60 ? `${q}m` : `${q / 60}h`}
          </button>
        ))}
      </div>
      <div
        className="basis-full text-[11px]"
        style={{ color: tone }}
        title="완료된 work 세션 합산"
      >
        실제{" "}
        <span className="font-mono font-medium">
          {formatMinutes(actualMin)}
        </span>
        {est != null && est > 0 && (
          <>
            {" "}
            / 예상 {formatMinutes(est)}
            <span className="ml-1 text-[var(--ink-3)]">
              ({Math.round(ratio * 100)}%)
            </span>
            {overBudget && <span className="ml-1">⚠ 초과</span>}
          </>
        )}
      </div>
    </div>
  );
}

const SATISFACTION_OPTIONS: {
  value: Satisfaction;
  label: string;
  emoji: string;
}[] = [
  { value: "low", label: "아쉬움", emoji: "😕" },
  { value: "mid", label: "보통", emoji: "🙂" },
  { value: "high", label: "만족", emoji: "🤩" },
];

function ReflectionSection({ task }: { task: Task }) {
  const r = task.reflection;
  const [note, setNote] = useState(r?.note ?? "");
  const [actualMin, setActualMin] = useState(
    r?.actualMin != null ? String(r.actualMin) : "",
  );

  useEffect(() => {
    setNote(task.reflection?.note ?? "");
    setActualMin(
      task.reflection?.actualMin != null
        ? String(task.reflection.actualMin)
        : "",
    );
  }, [task.reflection?.note, task.reflection?.actualMin]);

  const patch = (p: Partial<TaskReflection>) => {
    const next: TaskReflection = {
      ...(task.reflection ?? {}),
      ...p,
      recordedAt: Date.now(),
    };
    void updateTask(task.id, { reflection: next });
  };
  const commitNote = () => {
    if ((note || "") !== (task.reflection?.note ?? "")) {
      patch({ note: note || undefined });
    }
  };
  const commitActual = () => {
    const v = actualMin.trim();
    const n = v === "" ? undefined : Math.max(0, Math.floor(Number(v)));
    if (Number.isNaN(n as number)) return;
    if (n !== task.reflection?.actualMin) patch({ actualMin: n });
  };

  return (
    <Field label="완료 회고">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-1)] p-3">
        <div className="mb-2 flex items-center gap-1">
          {SATISFACTION_OPTIONS.map((opt) => {
            const active = task.reflection?.satisfaction === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => patch({ satisfaction: opt.value })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                  active
                    ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
                    : "border-[var(--line-strong)] bg-[var(--bg-0)] text-[var(--ink-2)] hover:bg-[var(--bg-2)]",
                )}
              >
                <span aria-hidden>{opt.emoji}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
          placeholder="어땠나요? 잘된 점·아쉬운 점·다음 액션…"
          rows={3}
          className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
        />
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
            실제 소요 (분)
          </span>
          <input
            type="number"
            min={0}
            step={5}
            value={actualMin}
            onChange={(e) => setActualMin(e.target.value)}
            onBlur={commitActual}
            placeholder={
              task.estimateMin != null ? String(task.estimateMin) : "—"
            }
            className="w-20 rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1 text-right"
          />
          {task.estimateMin != null &&
            task.reflection?.actualMin != null &&
            task.estimateMin > 0 && (
              <span className="text-[var(--ink-3)]">
                예상 {task.estimateMin}분 ·{" "}
                {Math.round(
                  (task.reflection.actualMin / task.estimateMin) * 100,
                )}
                %
              </span>
            )}
        </div>
      </div>
    </Field>
  );
}

function RecurrenceField({ task }: { task: Task }) {
  const enabled = !!task.rrule;
  const r = task.rrule;
  const save = (rrule: RecurrenceRule | undefined) =>
    updateTask(task.id, { rrule });

  const setEnabled = (on: boolean) => {
    if (on) {
      if (r) return;
      save({ freq: "weekly", interval: 1 });
    } else {
      save(undefined);
    }
  };
  const patch = (p: Partial<RecurrenceRule>) => {
    if (!r) return;
    save({ ...r, ...p });
  };
  const toggleWeekday = (d: Weekday) => {
    if (!r) return;
    const cur = new Set(r.byweekday ?? []);
    if (cur.has(d)) cur.delete(d);
    else cur.add(d);
    const next = [...cur].sort() as Weekday[];
    save({ ...r, byweekday: next.length > 0 ? next : undefined });
  };
  const endKind: "never" | "until" = r?.until != null ? "until" : "never";

  return (
    <Field label="반복">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-1)] p-3 text-xs">
        <label className="flex items-center justify-between">
          <span className="text-[var(--ink-2)]">
            {enabled
              ? "완료 시 다음 발생을 자동 생성"
              : "반복 없음 — 일회성 Task"}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[var(--ink-0)]"
          />
        </label>
        {enabled && r && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <select
                value={r.freq}
                onChange={(e) =>
                  patch({ freq: e.target.value as RecurrenceRule["freq"] })
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
                value={r.interval ?? 1}
                onChange={(e) =>
                  patch({ interval: Math.max(1, Number(e.target.value) || 1) })
                }
                className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1"
                aria-label="반복 간격"
              />
              <span className="text-[var(--ink-3)]">간격</span>
            </div>
            {r.freq === "weekly" && (
              <div className="flex flex-wrap items-center gap-1">
                {WEEKDAY_LABEL.map((wd, i) => {
                  const active = (r.byweekday ?? []).includes(i as Weekday);
                  return (
                    <button
                      key={wd}
                      type="button"
                      onClick={() => toggleWeekday(i as Weekday)}
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
                {(["never", "until"] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name={`task-rrule-end-${task.id}`}
                      checked={endKind === k}
                      onChange={() =>
                        patch(
                          k === "never"
                            ? { until: undefined }
                            : { until: Date.now() },
                        )
                      }
                      className="accent-[var(--ink-0)]"
                    />
                    <span>{k === "never" ? "없음" : "날짜까지"}</span>
                  </label>
                ))}
              </div>
              {endKind === "until" && (
                <input
                  type="date"
                  value={r.until ? toDateInput(r.until) : ""}
                  onChange={(e) => {
                    if (!e.target.value) {
                      patch({ until: undefined });
                      return;
                    }
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    const t = new Date(y, m - 1, d, 23, 59, 59).getTime();
                    patch({ until: t });
                  }}
                  className="mt-1 w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1.5"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}

function toDateInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function SubtaskSection({ parentId }: { parentId: string }) {
  const subtasks = useSubtasks(parentId);
  const setSelected = useAppStore((s) => s.setSelectedTaskId);
  const [draft, setDraft] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setDraft("");
    await createTask({ title: v, parentId });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        서브 업무 · {subtasks.length}
      </span>
      {subtasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--line)] px-3 py-2 text-[11px] text-[var(--ink-3)]">
          아직 없어요 — 아래에 추가해보세요.
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {subtasks.map((s) => {
            const done = s.status === "done";
            const prio = PRIORITY_TONE[s.priority];
            return (
              <li
                key={s.id}
                className="group flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1.5"
                style={{ borderLeft: `3px solid ${prio.token}` }}
              >
                <button
                  type="button"
                  onClick={() => void toggleTaskStatus(s.id)}
                  aria-label={done ? "완료 해제" : "완료"}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                    done
                      ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
                      : "border-[var(--line-strong)] text-transparent hover:border-[var(--ink-2)]",
                  )}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "min-w-0 flex-1 truncate text-left text-xs",
                    done && "text-[var(--ink-3)] line-through",
                  )}
                  title={s.title}
                >
                  {s.title}
                </button>
                <span
                  className="hidden rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider sm:inline"
                  style={{
                    color: prio.token,
                    background: `color-mix(in oklab, ${prio.token} 16%, transparent)`,
                  }}
                >
                  {prio.short}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      typeof window !== "undefined" &&
                      !window.confirm("서브 업무를 삭제할까요?")
                    )
                      return;
                    await deleteTask(s.id);
                  }}
                  aria-label="삭제"
                  className="rounded p-1 text-[var(--ink-4)] opacity-0 transition-opacity hover:text-[var(--danger-ink)] group-hover:opacity-100"
                >
                  <FiX aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.nativeEvent.isComposing || e.keyCode === 229)
            ) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          placeholder="서브 업무 추가 — Enter"
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
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </span>
      {children}
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
