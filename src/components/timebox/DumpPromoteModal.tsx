"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
import { LabelPicker } from "@/components/shell/LabelPicker";
import { promoteDumpToTask } from "@/db/repositories/dumpItems";
import { cn } from "@/lib/cn";
import { dateKey } from "@/lib/dueDate";
import { PRIORITY_TONE } from "@/lib/taskColors";
import type { DumpItem, Priority } from "@/types/domain";

const PRIORITY_OPTIONS: Priority[] = [1, 2, 3, 4];

interface Props {
  item: DumpItem | null;
  onClose: () => void;
}

export function DumpPromoteModal({ item, onClose }: Props) {
  const [priority, setPriority] = useState<Priority>(3);
  const [due, setDue] = useState<string>("");
  const [estimateMin, setEstimateMin] = useState<string>("");
  const [labelIds, setLabelIds] = useState<string[]>([]);

  useEffect(() => {
    if (!item) return;
    setPriority(3);
    setDue("");
    setEstimateMin("");
    setLabelIds([]);
  }, [item]);

  const submit = async () => {
    if (!item) return;
    const est = estimateMin.trim() === "" ? undefined : Number(estimateMin);
    await promoteDumpToTask(item.id, {
      priority,
      due: due || undefined,
      estimateMin: Number.isFinite(est) ? est : undefined,
      labelIds: labelIds.length > 0 ? labelIds : undefined,
    });
    onClose();
  };

  const setRelative = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDue(dateKey(d));
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-6 shadow-2xl"
          >
            <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
              <FiArrowRight aria-hidden className="text-[11px]" />
              Task로 옮기기
            </div>
            <div className="mb-4 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-3 py-2 text-sm">
              {item.text}
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <Field label="우선순위">
                <div className="flex w-full overflow-hidden rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] p-0.5">
                  {PRIORITY_OPTIONS.map((p) => {
                    const tone = PRIORITY_TONE[p];
                    const selected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setPriority(p)}
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

              <Field label="마감일">
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
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
                    {due && (
                      <button
                        type="button"
                        onClick={() => setDue("")}
                        className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-3)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-0)]"
                      >
                        지우기
                      </button>
                    )}
                  </div>
                </div>
              </Field>

              <Field label="예상 소요시간 (분)">
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={estimateMin}
                    onChange={(e) => setEstimateMin(e.target.value)}
                    placeholder="—"
                    className="min-w-0 flex-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5"
                  />
                  <div className="flex flex-wrap gap-1">
                    {([15, 30, 60, 90] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setEstimateMin(String(q))}
                        className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5 text-[10px] uppercase tracking-wider text-[var(--ink-2)] hover:bg-[var(--bg-2)] hover:text-[var(--ink-0)]"
                      >
                        {q < 60 ? `${q}m` : `${q / 60}h`}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>

              <Field label="라벨">
                <LabelPicker selected={labelIds} onChange={setLabelIds} />
              </Field>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                Shift+클릭으로 분류 없이 바로 승격
              </span>
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
                  onClick={() => void submit()}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--ink-0)] px-4 py-2 text-sm text-[var(--bg-0)] hover:opacity-90"
                >
                  <FiArrowRight aria-hidden />
                  Task로 옮기기
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
