"use client";

import type { PomodoroPhase } from "@/types/domain";

const PHASE_TITLE: Record<PomodoroPhase, string> = {
  work: "작업 세션 종료",
  shortBreak: "짧은 휴식 종료",
  longBreak: "긴 휴식 종료",
};

const PHASE_BODY: Record<PomodoroPhase, string> = {
  work: "수고하셨어요. 잠시 숨을 고르세요.",
  shortBreak: "휴식이 끝났습니다. 다시 집중해볼까요?",
  longBreak: "긴 휴식이 끝났습니다. 다음 사이클을 시작하세요.",
};

export function supportsNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!supportsNotifications()) return null;
  return Notification.permission;
}

export async function ensurePermission(): Promise<NotificationPermission> {
  if (!supportsNotifications()) return "denied";
  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext ??
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.5);
    osc.onended = () => ctx.close().catch(() => undefined);
  } catch {
    /* ignore audio failures */
  }
}

export interface NotifyParams {
  phase: PomodoroPhase;
  enabled: boolean;
  sound: boolean;
}

export function notifyPhaseEnd({ phase, enabled, sound }: NotifyParams): void {
  if (!enabled) return;
  if (sound) playBeep();
  if (!supportsNotifications()) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(PHASE_TITLE[phase], {
      body: PHASE_BODY[phase],
      tag: "doro-timer",
      silent: !sound,
    });
  } catch {
    /* ignore */
  }
}
