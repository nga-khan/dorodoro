"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Satisfaction, SessionReflection } from "@/types/domain";

interface Props {
  open: boolean;
  onSave: (reflection: SessionReflection) => void;
  onSkip: () => void;
}

const OPTIONS: { value: Satisfaction; label: string; shade: string }[] = [
  { value: "low", label: "낮음", shade: "var(--ink-4)" },
  { value: "mid", label: "보통", shade: "var(--ink-2)" },
  { value: "high", label: "높음", shade: "var(--ink-0)" },
];

export function SessionReflectionModal({ open, onSave, onSkip }: Props) {
  const [note, setNote] = useState("");
  const [satisfaction, setSatisfaction] = useState<Satisfaction>("mid");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNote("");
      setSatisfaction("mid");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const submit = () => {
    onSave({ note: note.trim(), satisfaction, recordedAt: Date.now() });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-6 shadow-[var(--shadow-card)]"
          >
            <div className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
              세션 회고
            </div>
            <h2 className="mb-4 text-lg font-medium tracking-tight">
              이 시간 동안 무엇을 했나요?
            </h2>
            <input
              ref={inputRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="한 줄로 정리"
              className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink-2)]"
            />

            <div className="mt-5">
              <div className="mb-2 text-xs text-[var(--ink-2)]">
                시간 사용 만족도
              </div>
              <div className="grid grid-cols-3 gap-2">
                {OPTIONS.map((opt) => {
                  const active = satisfaction === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSatisfaction(opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border py-3 transition-all",
                        active
                          ? "border-[var(--ink-0)] bg-[var(--bg-1)]"
                          : "border-[var(--line)] bg-[var(--bg-0)] hover:bg-[var(--bg-1)]",
                      )}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-[var(--line-strong)]"
                        style={{ background: opt.shade }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="rounded-lg px-3 py-2 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
              >
                건너뛰기
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-lg bg-[var(--ink-0)] px-4 py-2 text-sm text-[var(--bg-0)] hover:opacity-90"
              >
                저장
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
