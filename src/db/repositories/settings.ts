"use client";

import { DEFAULT_SETTINGS, getDB } from "@/db/dexie";
import type { Settings } from "@/types/domain";

export async function ensureSettings(): Promise<Settings> {
  const db = getDB();
  const existing = await db.settings.get("singleton");
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(
  patch: Partial<Omit<Settings, "id">>,
): Promise<void> {
  await getDB().settings.update("singleton", patch);
}
