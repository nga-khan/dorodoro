"use client";

import { useEffect, useRef } from "react";
import { expandEvent } from "@/components/calendar/expandRecurrence";
import { useEvents, useSettings, useTasks } from "@/db/hooks";
import { dateKey, isOverdue } from "@/lib/dueDate";
import { notifyReminder } from "@/lib/notify";

const POLL_MS = 60_000;
const LOOKAHEAD_MS = 6 * 60 * 60_000;

/**
 * Background reminder watcher.
 * - Events: fires when `now` is within (start - reminderMin .. start].
 * - Tasks: fires once per day for today's-due and overdue tasks, on first tick
 *   after each local-day boundary.
 * Dedupes via an in-memory set keyed by `tag`.
 */
export function useReminders() {
  const events = useEvents();
  const tasks = useTasks();
  const settings = useSettings();
  const fired = useRef<Set<string>>(new Set());
  const lastTaskDigest = useRef<string | null>(null);

  useEffect(() => {
    if (!settings.notifications.enabled) return;
    const sound = settings.notifications.sound;

    const tick = () => {
      const now = Date.now();

      // --- Events ---
      const horizonEnd = now + LOOKAHEAD_MS;
      for (const ev of events) {
        const r = ev.reminderMin;
        if (r == null) continue;
        // Expand recurring events covering the lookahead window.
        const instances = expandEvent(ev, now - 60_000, horizonEnd);
        for (const inst of instances) {
          const triggerAt = inst.start - r * 60_000;
          if (triggerAt > now) continue;
          if (inst.start < now - 60_000) continue;
          const tag = `ev:${inst.id}`;
          if (fired.current.has(tag)) continue;
          fired.current.add(tag);
          const mins = Math.max(0, Math.round((inst.start - now) / 60_000));
          notifyReminder({
            title: ev.title || "일정",
            body:
              mins === 0
                ? "지금 시작합니다"
                : `${mins}분 후 시작 (${formatHHMM(inst.start)})`,
            tag,
            sound,
          });
        }
      }

      // --- Tasks (daily digest of overdue + due-today) ---
      const todayKey = dateKey(new Date());
      const overdueCount = tasks.filter((t) => isOverdue(t)).length;
      const todayCount = tasks.filter(
        (t) => t.due === todayKey && t.status !== "done",
      ).length;
      const digest = `${todayKey}|o${overdueCount}|t${todayCount}`;
      if (
        lastTaskDigest.current !== digest &&
        (overdueCount > 0 || todayCount > 0)
      ) {
        lastTaskDigest.current = digest;
        const parts: string[] = [];
        if (overdueCount > 0) parts.push(`마감 지남 ${overdueCount}건`);
        if (todayCount > 0) parts.push(`오늘 마감 ${todayCount}건`);
        notifyReminder({
          title: "마감 알림",
          body: parts.join(" · "),
          tag: `tasks:${todayKey}`,
          sound,
        });
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [
    events,
    tasks,
    settings.notifications.enabled,
    settings.notifications.sound,
  ]);
}

function formatHHMM(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
