"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import type { ID, Label } from "@/types/domain";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export function nextLabelColor(existing: Label[]): string {
  const used = new Set(existing.map((l) => l.color.toLowerCase()));
  const free = PALETTE.find((c) => !used.has(c.toLowerCase()));
  if (free) return free;
  return PALETTE[existing.length % PALETTE.length];
}

export async function createLabel(input: {
  name: string;
  color: string;
}): Promise<Label> {
  const label: Label = {
    id: nanoid(),
    name: input.name.trim() || "(라벨)",
    color: input.color,
    createdAt: Date.now(),
  };
  await getDB().labels.put(label);
  return label;
}

export async function updateLabel(
  id: ID,
  patch: Partial<Omit<Label, "id" | "createdAt">>,
) {
  await getDB().labels.update(id, patch);
}

export async function deleteLabel(id: ID) {
  await getDB().labels.delete(id);
  // Best-effort: scrub from tasks/events/goals.
  const db = getDB();
  await db.tasks
    .filter((t) => Array.isArray(t.labelIds) && t.labelIds.includes(id))
    .modify((t) => {
      t.labelIds = (t.labelIds ?? []).filter((x) => x !== id);
    });
  await db.events
    .filter((e) => Array.isArray(e.labelIds) && e.labelIds.includes(id))
    .modify((e) => {
      e.labelIds = (e.labelIds ?? []).filter((x) => x !== id);
    });
  await db.goals
    .filter((g) => Array.isArray(g.labelIds) && g.labelIds.includes(id))
    .modify((g) => {
      g.labelIds = (g.labelIds ?? []).filter((x) => x !== id);
    });
}
