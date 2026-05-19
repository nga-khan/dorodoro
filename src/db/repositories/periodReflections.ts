"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import type { PeriodReflection, ReflectionPeriod } from "@/types/domain";

const now = () => Date.now();

export async function getPeriodReflection(
  period: ReflectionPeriod,
  anchor: number,
): Promise<PeriodReflection | undefined> {
  return getDB()
    .periodReflections.where("[period+anchor]")
    .equals([period, anchor])
    .first();
}

export async function upsertPeriodReflection(
  period: ReflectionPeriod,
  anchor: number,
  patch: Partial<
    Omit<PeriodReflection, "id" | "period" | "anchor" | "createdAt">
  >,
): Promise<PeriodReflection> {
  const db = getDB();
  const existing = await db.periodReflections
    .where("[period+anchor]")
    .equals([period, anchor])
    .first();
  if (existing) {
    const next = { ...existing, ...patch, updatedAt: now() };
    await db.periodReflections.put(next);
    return next;
  }
  const created: PeriodReflection = {
    id: nanoid(),
    period,
    anchor,
    ...patch,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.periodReflections.add(created);
  return created;
}

export async function deletePeriodReflection(id: string): Promise<void> {
  await getDB().periodReflections.delete(id);
}
