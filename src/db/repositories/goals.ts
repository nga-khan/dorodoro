"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import type { Goal, KeyResult, Kpi } from "@/types/domain";

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
