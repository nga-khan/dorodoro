"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, getDB } from "@/db/dexie";
import { ensureSettings } from "@/db/repositories/settings";
import type {
  CalendarEvent,
  DumpItem,
  Goal,
  Label,
  PomodoroSession,
  Settings,
  Task,
  TaskTemplate,
} from "@/types/domain";

// Run on client only; SSR returns null.
function useClientDB<T>(fn: () => Promise<T>, deps: unknown[], initial: T): T {
  const result = useLiveQuery(async () => {
    if (typeof window === "undefined") return initial;
    return fn();
  }, deps);
  return result ?? initial;
}

export function useTasks(): Task[] {
  return useClientDB(() => getDB().tasks.orderBy("order").toArray(), [], []);
}

export function useTasksInRange(startMs: number, endMs: number): Task[] {
  return useClientDB(
    async () =>
      getDB()
        .tasks.where("start")
        .between(startMs, endMs, true, true)
        .toArray(),
    [startMs, endMs],
    [],
  );
}

export function useDumpItems(): DumpItem[] {
  return useClientDB(
    () => getDB().dumpItems.orderBy("order").toArray(),
    [],
    [],
  );
}

export function useEvents(): CalendarEvent[] {
  return useClientDB(() => getDB().events.orderBy("start").toArray(), [], []);
}

export function useEventsInRange(
  startMs: number,
  endMs: number,
): CalendarEvent[] {
  return useClientDB(
    async () =>
      getDB()
        .events.where("start")
        .between(startMs, endMs, true, true)
        .toArray(),
    [startMs, endMs],
    [],
  );
}

export function useSessions(): PomodoroSession[] {
  return useClientDB(
    () => getDB().sessions.orderBy("startedAt").reverse().toArray(),
    [],
    [],
  );
}

export function useSessionsInRange(
  startMs: number,
  endMs: number,
): PomodoroSession[] {
  return useClientDB(
    async () =>
      getDB()
        .sessions.where("startedAt")
        .between(startMs, endMs, true, true)
        .toArray(),
    [startMs, endMs],
    [],
  );
}

export function useTaskTemplates(): TaskTemplate[] {
  return useClientDB(
    () => getDB().taskTemplates.orderBy("updatedAt").reverse().toArray(),
    [],
    [],
  );
}

export function useLabels(): Label[] {
  return useClientDB(
    () => getDB().labels.orderBy("createdAt").toArray(),
    [],
    [],
  );
}

export function useGoals(): Goal[] {
  return useClientDB(
    () => getDB().goals.orderBy("targetDate").toArray(),
    [],
    [],
  );
}

export function useSettings(): Settings {
  const [bootstrapped, setBootstrapped] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureSettings().finally(() => setBootstrapped(true));
  }, []);
  const settings = useLiveQuery(async () => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    return (await getDB().settings.get("singleton")) ?? DEFAULT_SETTINGS;
  }, [bootstrapped]);
  return settings ?? DEFAULT_SETTINGS;
}
