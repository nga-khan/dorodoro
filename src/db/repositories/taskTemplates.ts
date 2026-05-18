"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import { createTask } from "@/db/repositories/tasks";
import type { TaskTemplate, TaskTemplateItem } from "@/types/domain";

const now = () => Date.now();

export async function createTemplate(input: {
  name: string;
  items?: TaskTemplateItem[];
}): Promise<TaskTemplate> {
  const tpl: TaskTemplate = {
    id: nanoid(),
    name: input.name.trim() || "(이름 없음)",
    items: input.items ?? [],
    createdAt: now(),
    updatedAt: now(),
  };
  await getDB().taskTemplates.add(tpl);
  return tpl;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Omit<TaskTemplate, "id" | "createdAt">>,
): Promise<void> {
  await getDB().taskTemplates.update(id, { ...patch, updatedAt: now() });
}

export async function deleteTemplate(id: string): Promise<void> {
  await getDB().taskTemplates.delete(id);
}

/**
 * Create one Task per template item. Tasks are appended to the end
 * of the current task list. If `start` is provided, tasks are placed
 * sequentially using `estimateMin` (default 25) as the slot length.
 */
export async function applyTemplate(
  templateId: string,
  options?: { start?: number },
): Promise<void> {
  const db = getDB();
  const tpl = await db.taskTemplates.get(templateId);
  if (!tpl) return;
  let cursor = options?.start;
  for (const item of tpl.items) {
    const len = (item.estimateMin ?? 25) * 60_000;
    const start = cursor;
    const end = cursor != null ? cursor + len : undefined;
    await createTask({
      title: item.title,
      priority: item.priority,
      start,
      end,
    });
    if (cursor != null) cursor = end;
  }
}
