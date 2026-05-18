"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import type {
  PomodoroPhase,
  PomodoroSession,
  SessionReflection,
} from "@/types/domain";

export async function startSession(input: {
  plannedMs: number;
  phase: PomodoroPhase;
  taskId?: string;
}): Promise<PomodoroSession> {
  const session: PomodoroSession = {
    id: nanoid(),
    startedAt: Date.now(),
    plannedMs: input.plannedMs,
    phase: input.phase,
    taskId: input.taskId,
    completed: false,
  };
  await getDB().sessions.add(session);
  return session;
}

export async function finishSession(
  id: string,
  completed: boolean,
): Promise<void> {
  await getDB().sessions.update(id, { endedAt: Date.now(), completed });
}

export async function setSessionReflection(
  id: string,
  reflection: SessionReflection,
): Promise<void> {
  await getDB().sessions.update(id, { reflection });
}

export async function deleteSession(id: string): Promise<void> {
  await getDB().sessions.delete(id);
}
