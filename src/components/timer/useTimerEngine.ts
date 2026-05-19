"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  finishSession,
  setSessionReflection,
  startSession,
} from "@/db/repositories/sessions";
import { notifyPhaseEnd } from "@/lib/notify";
import type {
  PomodoroPhase,
  SessionReflection,
  Settings,
} from "@/types/domain";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerEngineState {
  status: TimerStatus;
  phase: PomodoroPhase;
  totalMs: number;
  remainingMs: number;
  sessionId: string | null;
  completedSets: number; // 누적된 work 세션 횟수 (긴휴식 진입용)
  // 회고 모달 제어용: 최근 종료된 work 세션
  pendingReflectionSessionId: string | null;
}

interface UseTimerEngineParams {
  settings: Settings;
  manualMinutes: number; // 사용자가 슬라이더로 설정한 분(단일 카운트다운 또는 work 길이)
}

export function useTimerEngine({
  settings,
  manualMinutes,
}: UseTimerEngineParams) {
  const [state, setState] = useState<TimerEngineState>({
    status: "idle",
    phase: "work",
    totalMs: manualMinutes * 60_000,
    remainingMs: manualMinutes * 60_000,
    sessionId: null,
    completedSets: 0,
    pendingReflectionSessionId: null,
  });

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // Reset displayed total when user changes slider while idle.
  useEffect(() => {
    setState((s) => {
      if (s.status !== "idle") return s;
      const ms = manualMinutes * 60_000;
      return { ...s, totalMs: ms, remainingMs: ms };
    });
  }, [manualMinutes]);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTickRef.current = null;
  }, []);

  const tick = useCallback((now: number) => {
    setState((s) => {
      if (s.status !== "running") return s;
      const last = lastTickRef.current ?? now;
      const delta = now - last;
      lastTickRef.current = now;
      const remaining = Math.max(0, s.remainingMs - delta);
      return { ...s, remainingMs: remaining };
    });
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (state.status === "running") {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
      return stopRaf;
    }
    stopRaf();
    return undefined;
  }, [state.status, tick, stopRaf]);

  // Handle completion when remainingMs hits 0 while running.
  useEffect(() => {
    if (state.status !== "running" || state.remainingMs > 0) return;
    void (async () => {
      if (state.sessionId) await finishSession(state.sessionId, true);
      const pending = state.phase === "work" ? state.sessionId : null;
      const n = settings.notifications;
      if (n?.enabled && n.perPhase[state.phase]) {
        notifyPhaseEnd({
          phase: state.phase,
          enabled: n.enabled,
          sound: n.sound,
        });
      }
      setState((s) => ({
        ...s,
        status: "completed",
        pendingReflectionSessionId: pending,
        completedSets:
          s.phase === "work" ? s.completedSets + 1 : s.completedSets,
      }));
    })();
  }, [
    state.status,
    state.remainingMs,
    state.sessionId,
    state.phase,
    settings.notifications,
  ]);

  const phaseDurationMs = useCallback(
    (phase: PomodoroPhase): number => {
      if (phase === "work") return manualMinutes * 60_000;
      if (phase === "shortBreak") return settings.cycle.shortMin * 60_000;
      return settings.cycle.longMin * 60_000;
    },
    [manualMinutes, settings.cycle.shortMin, settings.cycle.longMin],
  );

  const start = useCallback(
    async (phase?: PomodoroPhase) => {
      const nextPhase: PomodoroPhase = phase ?? state.phase;
      const total = phaseDurationMs(nextPhase);
      const session = await startSession({
        plannedMs: total,
        phase: nextPhase,
      });
      setState((s) => ({
        ...s,
        status: "running",
        phase: nextPhase,
        totalMs: total,
        remainingMs: total,
        sessionId: session.id,
      }));
    },
    [phaseDurationMs, state.phase],
  );

  const pause = useCallback(() => {
    setState((s) => (s.status === "running" ? { ...s, status: "paused" } : s));
  }, []);

  const resume = useCallback(() => {
    setState((s) => (s.status === "paused" ? { ...s, status: "running" } : s));
  }, []);

  const completeNow = useCallback(() => {
    setState((s) =>
      s.status === "running" || s.status === "paused"
        ? { ...s, status: "running", remainingMs: 0 }
        : s,
    );
  }, []);

  const reset = useCallback(async () => {
    if (state.sessionId && state.status !== "completed") {
      await finishSession(state.sessionId, false);
    }
    setState({
      status: "idle",
      phase: "work",
      totalMs: manualMinutes * 60_000,
      remainingMs: manualMinutes * 60_000,
      sessionId: null,
      completedSets: 0,
      pendingReflectionSessionId: null,
    });
  }, [manualMinutes, state.sessionId, state.status]);

  const saveReflection = useCallback(
    async (reflection: SessionReflection | null) => {
      const id = state.pendingReflectionSessionId;
      if (id && reflection) {
        await setSessionReflection(id, reflection);
      }
      setState((s) => ({ ...s, pendingReflectionSessionId: null }));
      // Auto advance phase if cycle mode is enabled and previous phase was work.
      if (settings.cycleEnabled && state.phase === "work") {
        const nextPhase: PomodoroPhase =
          state.completedSets % settings.cycle.setsBeforeLong === 0
            ? "longBreak"
            : "shortBreak";
        await start(nextPhase);
      } else if (settings.cycleEnabled && state.phase !== "work") {
        await start("work");
      }
    },
    [
      settings.cycleEnabled,
      settings.cycle.setsBeforeLong,
      state.completedSets,
      state.pendingReflectionSessionId,
      state.phase,
      start,
    ],
  );

  return { state, start, pause, resume, completeNow, reset, saveReflection };
}
