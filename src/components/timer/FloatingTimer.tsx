"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FiMaximize2, FiPause, FiPlay, FiSkipForward } from "react-icons/fi";
import { useSettings } from "@/db/hooks";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/stores/app";
import { useSystemStore } from "@/stores/system";
import { PomodoroDial } from "./PomodoroDial";
import { useTimer } from "./TimerContext";

const SIZE = { w: 220, h: 96 };
const MARGIN = 12;

type Corner = "lb" | "lt" | "rt" | "rb";

function cornerToXY(c: Corner, mobileOffset: number): { x: number; y: number } {
  const w = typeof window === "undefined" ? 1280 : window.innerWidth;
  const h = typeof window === "undefined" ? 800 : window.innerHeight;
  const left = MARGIN;
  const right = w - SIZE.w - MARGIN;
  const top = MARGIN;
  const bottom = h - SIZE.h - MARGIN - mobileOffset;
  switch (c) {
    case "lb":
      return { x: left, y: bottom };
    case "lt":
      return { x: left, y: top };
    case "rt":
      return { x: right, y: top };
    case "rb":
      return { x: right, y: bottom };
  }
}

function nearestCorner(
  x: number,
  y: number,
  mobileOffset: number,
): { corner: Corner; pos: { x: number; y: number } } {
  const corners: Corner[] = ["lb", "lt", "rt", "rb"];
  let best: Corner = "lb";
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of corners) {
    const p = cornerToXY(c, mobileOffset);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return { corner: best, pos: cornerToXY(best, mobileOffset) };
}

export function FloatingTimer() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const floatPos = useSystemStore((s) => s.floatPos);
  const setFloatPos = useSystemStore((s) => s.setFloatPos);
  const settings = useSettings();
  const { state, pause, resume, completeNow } = useTimer();

  const mobileOffset =
    typeof window !== "undefined" && window.innerWidth < 768 ? 80 : 0;

  // Determine visibility: only when timer is active and we're off the timer tab.
  const visible =
    activeTab !== "timer" &&
    (state.status === "running" || state.status === "paused");

  // Position: default to left-bottom on first render.
  const [pos, setPos] = useState(() => {
    if (floatPos) return floatPos;
    return cornerToXY("lb", mobileOffset);
  });

  useEffect(() => {
    if (floatPos) setPos(floatPos);
  }, [floatPos]);

  // Keep within viewport on resize.
  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        const x = Math.min(
          Math.max(MARGIN, p.x),
          window.innerWidth - SIZE.w - MARGIN,
        );
        const y = Math.min(
          Math.max(MARGIN, p.y),
          window.innerHeight - SIZE.h - MARGIN - mobileOffset,
        );
        return { x, y };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mobileOffset]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="floating-timer"
          drag
          dragMomentum={false}
          dragElastic={0.18}
          dragConstraints={{
            left: MARGIN,
            top: MARGIN,
            right:
              (typeof window === "undefined" ? 1280 : window.innerWidth) -
              SIZE.w -
              MARGIN,
            bottom:
              (typeof window === "undefined" ? 800 : window.innerHeight) -
              SIZE.h -
              MARGIN -
              mobileOffset,
          }}
          onDragEnd={(event, info) => {
            const shift = (event as { shiftKey?: boolean }).shiftKey === true;
            const x = pos.x + info.offset.x;
            const y = pos.y + info.offset.y;
            if (shift) {
              setFloatPos({ x, y });
              setPos({ x, y });
            } else {
              const { pos: snapped } = nearestCorner(x, y, mobileOffset);
              setFloatPos(snapped);
              setPos(snapped);
            }
          }}
          initial={{ opacity: 0, scale: 0.9, x: pos.x, y: pos.y }}
          animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: SIZE.w,
            height: SIZE.h,
            zIndex: 50,
          }}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2 shadow-[var(--shadow-card)] backdrop-blur cursor-grab active:cursor-grabbing",
          )}
        >
          <button
            type="button"
            onClick={() => setActiveTab("timer")}
            aria-label="타이머 탭으로 이동"
            className="shrink-0"
            title="타이머 탭"
          >
            <PomodoroDial
              size={72}
              color={settings.timerColor}
              totalMs={state.totalMs}
              remainingMs={state.remainingMs}
              isRunning={state.status === "running"}
            />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="truncate text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
              {state.phase === "work"
                ? "작업 중"
                : state.phase === "shortBreak"
                  ? "짧은 휴식"
                  : "긴 휴식"}
              {state.status === "paused" && " · 일시정지"}
            </div>
            <div className="flex items-center gap-1.5">
              {state.status === "running" ? (
                <button
                  type="button"
                  onClick={pause}
                  aria-label="일시정지"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] hover:bg-[var(--bg-1)]"
                >
                  <FiPause aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resume}
                  aria-label="재개"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink-0)] text-[var(--bg-0)] hover:opacity-90"
                >
                  <FiPlay aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={completeNow}
                aria-label="조기 완료"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] hover:bg-[var(--bg-1)]"
              >
                <FiSkipForward aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timer")}
                aria-label="확장"
                className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-3)] hover:bg-[var(--bg-1)] hover:text-[var(--ink-0)]"
              >
                <FiMaximize2 aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
