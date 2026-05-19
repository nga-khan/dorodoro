"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FiCheck, FiEdit3, FiX } from "react-icons/fi";
import { usePeriodReflection } from "@/db/hooks";
import { upsertPeriodReflection } from "@/db/repositories/periodReflections";
import { cn } from "@/lib/cn";
import type { ReflectionPeriod, Satisfaction } from "@/types/domain";

interface Props {
  open: boolean;
  period: ReflectionPeriod;
  anchor: number;
  onClose: () => void;
}

const PERIOD_LABEL: Record<ReflectionPeriod, string> = {
  weekly: "주간 회고",
  monthly: "월간 회고",
  yearly: "년간 회고",
};

const SAT_OPTIONS: { v: Satisfaction; label: string }[] = [
  { v: "low", label: "낮음" },
  { v: "mid", label: "보통" },
  { v: "high", label: "높음" },
];

function anchorLabel(period: ReflectionPeriod, anchor: number) {
  if (period === "weekly") return `${format(anchor, "yyyy. MM. dd")} 주`;
  if (period === "monthly") return format(anchor, "yyyy. MM");
  return format(anchor, "yyyy");
}

export function ReflectionModal({ open, period, anchor, onClose }: Props) {
  const existing = usePeriodReflection(period, anchor);
  const [wentWell, setWentWell] = useState("");
  const [improvements, setImprovements] = useState("");
  const [nextActions, setNextActions] = useState("");
  const [satisfaction, setSatisfaction] = useState<Satisfaction | undefined>();

  useEffect(() => {
    if (!open) return;
    setWentWell(existing?.wentWell ?? "");
    setImprovements(existing?.improvements ?? "");
    setNextActions(existing?.nextActions ?? "");
    setSatisfaction(existing?.satisfaction);
  }, [open, existing]);

  const save = async () => {
    await upsertPeriodReflection(period, anchor, {
      wentWell,
      improvements,
      nextActions,
      satisfaction,
    });
    onClose();
  };

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
              <FiEdit3 aria-hidden className="text-[11px]" />
              {PERIOD_LABEL[period]}
            </div>
            <h3 className="mb-4 text-base font-medium tracking-tight">
              {anchorLabel(period, anchor)}
            </h3>

            <Field
              label="잘된 점"
              value={wentWell}
              onChange={setWentWell}
              placeholder="이번 기간에 잘 풀린 일은?"
            />
            <Field
              label="아쉬운 점"
              value={improvements}
              onChange={setImprovements}
              placeholder="개선하고 싶은 부분은?"
            />
            <Field
              label="다음 행동"
              value={nextActions}
              onChange={setNextActions}
              placeholder="다음 기간에 시도할 액션 아이템"
            />

            <div className="mt-3 text-xs">
              <span className="mb-1 block text-[var(--ink-3)]">만족도</span>
              <div className="flex gap-1.5">
                {SAT_OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() =>
                      setSatisfaction((cur) => (cur === o.v ? undefined : o.v))
                    }
                    className={cn(
                      "flex-1 rounded-md border px-2 py-1.5 text-sm",
                      satisfaction === o.v
                        ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
                        : "border-[var(--line-strong)] text-[var(--ink-2)] hover:bg-[var(--bg-1)]",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-3">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
      />
    </div>
  );
}
