"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo } from "react";
import {
  FiCheckCircle,
  FiCoffee,
  FiPause,
  FiPlay,
  FiRotateCcw,
  FiSkipForward,
  FiZap,
} from "react-icons/fi";
import { useSettings } from "@/db/hooks";
import { updateSettings } from "@/db/repositories/settings";
import { cn } from "@/lib/cn";
import { useCommand } from "@/lib/shortcuts/bus";
import {
  clampMinutes,
  formatHMS,
  TIMER_MAX,
  TIMER_MIN,
  TIMER_STEP,
} from "@/lib/time";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { SessionReflection } from "@/types/domain";
import { FocusSummaryCards } from "./FocusSummaryCards";
import { HourGauge } from "./HourGauge";
import { PomodoroDial } from "./PomodoroDial";
import { SessionReflectionModal } from "./SessionReflectionModal";
import { TimerBackdrop } from "./TimerBackdrop";
import { useTimer } from "./TimerContext";

const PHASE_ICON = {
  work: FiZap,
  shortBreak: FiCoffee,
  longBreak: FiCheckCircle,
} as const;

const MINUTE_PRESETS = [20, 30, 50, 60, 90] as const;

const COLOR_PRESETS = [
  "#111111",
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#ef4444",
  "#a855f7",
];

const PHASE_LABEL: Record<string, string> = {
  work: "작업",
  shortBreak: "짧은 휴식",
  longBreak: "긴 휴식",
};

export function TimerPanel() {
  const settings = useSettings();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    state,
    start,
    pause,
    resume,
    completeNow,
    reset,
    saveReflection,
    manualMinutes,
    setManualMinutes,
  } = useTimer();

  // Apply user's CSS accent color globally.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--user-timer-color",
      settings.timerColor,
    );
  }, [settings.timerColor]);

  const dialSize = useMemo(() => (isMobile ? 280 : 340), [isMobile]);
  const reflectOpen = state.pendingReflectionSessionId !== null;

  const onTimerStart = useCallback(() => {
    if (state.status === "idle") start("work");
  }, [state.status, start]);
  const onTimerToggle = useCallback(() => {
    if (state.status === "running") pause();
    else if (state.status === "paused") resume();
    else if (state.status === "idle") start("work");
  }, [state.status, start, pause, resume]);
  useCommand("timer-start", onTimerStart);
  useCommand("timer-toggle", onTimerToggle);

  const onSliderChange = (v: number) => setManualMinutes(clampMinutes(v));
  const onColorChange = (c: string) => updateSettings({ timerColor: c });

  return (
    <section className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--ink-3)]">
        {(() => {
          const Icon = PHASE_ICON[state.phase as keyof typeof PHASE_ICON];
          return Icon ? <Icon aria-hidden className="text-[13px]" /> : null;
        })()}
        <span>{PHASE_LABEL[state.phase]}</span>
        <span>·</span>
        <span>{formatHMS(state.totalMs)}</span>
        {settings.cycleEnabled && (
          <>
            <span>·</span>
            <span>세트 {state.completedSets}</span>
          </>
        )}
      </div>

      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: dialSize, height: dialSize }}
        initial={false}
        animate={{
          scale:
            state.status === "running" || state.status === "paused" ? 1.06 : 1,
        }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <TimerBackdrop
          color={settings.timerColor}
          size={dialSize}
          active={state.status === "running"}
        />
        <PomodoroDial
          size={dialSize}
          color={settings.timerColor}
          totalMs={state.totalMs}
          remainingMs={state.remainingMs}
          isRunning={state.status === "running"}
        />
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: `${dialSize * 0.62}px` }}
        >
          <HourGauge
            color={settings.timerColor}
            totalMs={state.totalMs}
            remainingMs={state.remainingMs}
          />
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        {state.status === "idle" && (
          <button
            type="button"
            onClick={() => start("work")}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink-0)] px-6 py-2.5 text-sm text-[var(--bg-0)] hover:opacity-90"
          >
            <FiPlay aria-hidden />
            시작
          </button>
        )}
        {state.status === "running" && (
          <button
            type="button"
            onClick={pause}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-6 py-2.5 text-sm hover:bg-[var(--bg-1)]"
          >
            <FiPause aria-hidden />
            일시정지
          </button>
        )}
        {state.status === "paused" && (
          <button
            type="button"
            onClick={resume}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink-0)] px-6 py-2.5 text-sm text-[var(--bg-0)] hover:opacity-90"
          >
            <FiPlay aria-hidden />
            재개
          </button>
        )}
        {(state.status === "running" || state.status === "paused") && (
          <button
            type="button"
            onClick={completeNow}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--ink-1)] hover:bg-[var(--bg-1)]"
            aria-label="조기 완료"
          >
            <FiSkipForward aria-hidden />
            조기 완료
          </button>
        )}
        {(state.status === "running" ||
          state.status === "paused" ||
          state.status === "completed") && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
          >
            <FiRotateCcw aria-hidden />
            리셋
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {state.status === "idle" && (
          <motion.div
            key="timer-settings"
            className="flex w-full max-w-md flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 8,
              scale: 0.98,
              transition: { duration: 0.18, ease: "easeIn" },
            }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="flex items-baseline justify-between">
              <label htmlFor="slider" className="text-xs text-[var(--ink-2)]">
                작업 시간
              </label>
              <span className="font-mono text-sm">
                {manualMinutes < 60
                  ? `${manualMinutes}분`
                  : `${Math.floor(manualMinutes / 60)}시간 ${manualMinutes % 60}분`}
              </span>
            </div>
            <input
              id="slider"
              type="range"
              min={TIMER_MIN}
              max={TIMER_MAX}
              step={TIMER_STEP}
              value={manualMinutes}
              onChange={(e) => onSliderChange(Number(e.target.value))}
              className="w-full accent-[var(--ink-0)]"
            />

            <div className="flex flex-wrap gap-2">
              {MINUTE_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSliderChange(m)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    manualMinutes === m
                      ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
                      : "border-[var(--line)] text-[var(--ink-1)] hover:bg-[var(--bg-2)]",
                  )}
                >
                  {m}분
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--ink-2)]">색상</span>
              <div className="flex items-center gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`color ${c}`}
                    onClick={() => onColorChange(c)}
                    className={cn(
                      "h-6 w-6 rounded-full border transition-transform",
                      settings.timerColor === c
                        ? "border-[var(--ink-0)] scale-110"
                        : "border-[var(--line-strong)] hover:scale-105",
                    )}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={settings.timerColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded-full border border-[var(--line-strong)] bg-transparent"
                  aria-label="custom color"
                />
              </div>
            </div>

            <label className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-2)]">자동 사이클 모드</span>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ cycleEnabled: !settings.cycleEnabled })
                }
                className={cn(
                  "h-6 w-11 rounded-full border transition-colors",
                  settings.cycleEnabled
                    ? "border-[var(--ink-0)] bg-[var(--ink-0)]"
                    : "border-[var(--line-strong)] bg-[var(--bg-2)]",
                )}
                aria-pressed={settings.cycleEnabled}
              >
                <span
                  className={cn(
                    "block h-5 w-5 rounded-full bg-[var(--bg-0)] transition-transform",
                    settings.cycleEnabled ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </label>

            {settings.cycleEnabled && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <CycleInput
                  label="짧은 휴식 (분)"
                  value={settings.cycle.shortMin}
                  onChange={(v) =>
                    updateSettings({
                      cycle: { ...settings.cycle, shortMin: v },
                    })
                  }
                />
                <CycleInput
                  label="긴 휴식 (분)"
                  value={settings.cycle.longMin}
                  onChange={(v) =>
                    updateSettings({ cycle: { ...settings.cycle, longMin: v } })
                  }
                />
                <CycleInput
                  label="긴휴식 전 세트"
                  value={settings.cycle.setsBeforeLong}
                  onChange={(v) =>
                    updateSettings({
                      cycle: {
                        ...settings.cycle,
                        setsBeforeLong: Math.max(1, v),
                      },
                    })
                  }
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <FocusSummaryCards />

      <SessionReflectionModal
        open={reflectOpen}
        onSave={(r: SessionReflection) => saveReflection(r)}
        onSkip={() => saveReflection(null)}
      />
    </section>
  );
}

function CycleInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1.5 text-sm outline-none focus:border-[var(--ink-2)]"
      />
    </label>
  );
}
