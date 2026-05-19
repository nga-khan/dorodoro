"use client";

import { addDays, startOfDay } from "date-fns";
import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import { createTask } from "@/db/repositories/tasks";
import type {
  Checkpoint,
  CheckpointActionItem,
  Goal,
  KeyResult,
  Kpi,
} from "@/types/domain";

const now = () => Date.now();

export async function createGoal(input: {
  title: string;
  targetDate: number;
  objective?: string;
}): Promise<Goal> {
  const goal: Goal = {
    id: nanoid(),
    title: input.title.trim() || "(제목 없음)",
    targetDate: input.targetDate,
    objective: input.objective ?? "",
    keyResults: [],
    kpis: [],
    checkpoints: [],
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  };
  await getDB().goals.add(goal);
  return goal;
}

export async function updateGoal(
  id: string,
  patch: Partial<Omit<Goal, "id" | "createdAt">>,
): Promise<void> {
  await getDB().goals.update(id, { ...patch, updatedAt: now() });
}

export async function deleteGoal(id: string): Promise<void> {
  await getDB().goals.delete(id);
}

export function newKeyResult(): KeyResult {
  return { id: nanoid(), title: "" };
}

export function newKpi(): Kpi {
  return { id: nanoid(), title: "" };
}

// ─────────────────────────────── Checkpoints ───────────────────────────────

export function newCheckpoint(date: number, title = ""): Checkpoint {
  const t = now();
  return {
    id: nanoid(),
    title,
    date,
    done: false,
    createdAt: t,
    updatedAt: t,
  };
}

function sortByDate(list: Checkpoint[]): Checkpoint[] {
  return [...list].sort((a, b) => a.date - b.date);
}

async function withGoal<T>(
  goalId: string,
  fn: (g: Goal) => T | Promise<T>,
): Promise<T | undefined> {
  const db = getDB();
  const g = await db.goals.get(goalId);
  if (!g) return undefined;
  return fn(g);
}

async function commitCheckpoints(
  goalId: string,
  checkpoints: Checkpoint[],
): Promise<void> {
  const db = getDB();
  const current = await db.goals.get(goalId);
  const allDone =
    checkpoints.length > 0 && checkpoints.every((c) => c.done === true);
  const patch: Partial<Goal> = { checkpoints: sortByDate(checkpoints) };
  // 자동 달성은 진행 중일 때만 (실패/보류는 사용자 의도이므로 덮어쓰지 않음)
  if (allDone && current?.status === "active") patch.status = "achieved";
  await updateGoal(goalId, patch);
}

export async function addCheckpoint(
  goalId: string,
  cp?: Partial<Checkpoint> & { date: number },
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const base = newCheckpoint(cp?.date ?? now(), cp?.title ?? "");
    const merged: Checkpoint = { ...base, ...cp, id: base.id };
    await commitCheckpoints(goalId, [...(g.checkpoints ?? []), merged]);
  });
}

export async function updateCheckpoint(
  goalId: string,
  cpId: string,
  patch: Partial<Omit<Checkpoint, "id" | "createdAt">>,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const next = (g.checkpoints ?? []).map((c) =>
      c.id === cpId ? { ...c, ...patch, updatedAt: now() } : c,
    );
    await commitCheckpoints(goalId, next);
  });
}

export async function deleteCheckpoint(
  goalId: string,
  cpId: string,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const next = (g.checkpoints ?? []).filter((c) => c.id !== cpId);
    await commitCheckpoints(goalId, next);
  });
}

export async function toggleCheckpointDone(
  goalId: string,
  cpId: string,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const next = (g.checkpoints ?? []).map((c) =>
      c.id === cpId ? { ...c, done: !c.done, updatedAt: now() } : c,
    );
    await commitCheckpoints(goalId, next);
  });
}

// ──────────────────────── Auto-generate checkpoints ─────────────────────────

export type BackcastMode = "preset" | "even" | "halving";

const PRESET_DAYS = [7, 30, 90, 180, 365];

export async function generateCheckpoints(
  goalId: string,
  mode: BackcastMode = "preset",
  count = 5,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const todayMs = startOfDay(new Date()).getTime();
    const targetMs = g.targetDate;
    if (targetMs <= todayMs) return;
    const distanceDays = Math.floor((targetMs - todayMs) / 86_400_000);

    const dates: number[] = [];

    if (mode === "even") {
      const steps = Math.max(2, count);
      for (let i = 1; i < steps; i++) {
        const d = todayMs + Math.round((targetMs - todayMs) * (i / steps));
        dates.push(d);
      }
    } else if (mode === "halving") {
      // 목표일 기준 절반씩 당겨오기: target-d/2, target-d/4, ...
      let span = targetMs - todayMs;
      for (let i = 0; i < count - 1; i++) {
        span = Math.round(span / 2);
        const d = targetMs - span;
        if (d > todayMs && d < targetMs) dates.push(d);
      }
    } else {
      // preset
      const picked = PRESET_DAYS.filter((d) => d < distanceDays);
      for (const d of picked) {
        dates.push(addDays(todayMs, d).getTime());
      }
    }

    const finalCp: Checkpoint = {
      ...newCheckpoint(targetMs, g.title || "최종 목표"),
    };
    const nowCp: Checkpoint = {
      ...newCheckpoint(todayMs, "지금 / NOW"),
    };
    const middle: Checkpoint[] = dates
      .filter((d) => d > todayMs && d < targetMs)
      .map((d) => newCheckpoint(d, ""));

    const next = sortByDate([nowCp, ...middle, finalCp]);
    await commitCheckpoints(goalId, next);
  });
}

// ─────────────────────────── Action items (NOW) ─────────────────────────────

export function newActionItem(text = ""): CheckpointActionItem {
  return { id: nanoid(), text, done: false };
}

export async function addActionItem(
  goalId: string,
  cpId: string,
  text: string,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const next = (g.checkpoints ?? []).map((c) =>
      c.id === cpId
        ? {
            ...c,
            actionItems: [...(c.actionItems ?? []), newActionItem(text)],
            updatedAt: now(),
          }
        : c,
    );
    await commitCheckpoints(goalId, next);
  });
}

export async function updateActionItem(
  goalId: string,
  cpId: string,
  itemId: string,
  patch: Partial<CheckpointActionItem>,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const next = (g.checkpoints ?? []).map((c) =>
      c.id === cpId
        ? {
            ...c,
            actionItems: (c.actionItems ?? []).map((a) =>
              a.id === itemId ? { ...a, ...patch } : a,
            ),
            updatedAt: now(),
          }
        : c,
    );
    await commitCheckpoints(goalId, next);
  });
}

export async function deleteActionItem(
  goalId: string,
  cpId: string,
  itemId: string,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const next = (g.checkpoints ?? []).map((c) =>
      c.id === cpId
        ? {
            ...c,
            actionItems: (c.actionItems ?? []).filter((a) => a.id !== itemId),
            updatedAt: now(),
          }
        : c,
    );
    await commitCheckpoints(goalId, next);
  });
}

export async function toggleActionItemDone(
  goalId: string,
  cpId: string,
  itemId: string,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const next = (g.checkpoints ?? []).map((c) =>
      c.id === cpId
        ? {
            ...c,
            actionItems: (c.actionItems ?? []).map((a) =>
              a.id === itemId ? { ...a, done: !a.done } : a,
            ),
            updatedAt: now(),
          }
        : c,
    );
    await commitCheckpoints(goalId, next);
  });
}

export async function promoteActionToTask(
  goalId: string,
  cpId: string,
  itemId: string,
): Promise<void> {
  await withGoal(goalId, async (g) => {
    const cp = (g.checkpoints ?? []).find((c) => c.id === cpId);
    const item = cp?.actionItems?.find((a) => a.id === itemId);
    if (!cp || !item || item.taskId) return;
    const task = await createTask({
      title: item.text || "(액션 항목)",
      description: `Goal: ${g.title}\nCheckpoint: ${cp.title || "(이름 없음)"}`,
    });
    await updateActionItem(goalId, cpId, itemId, { taskId: task.id });
  });
}
