"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import { createTask } from "@/db/repositories/tasks";
import type { DumpItem, Priority } from "@/types/domain";

export async function createDumpItem(text: string): Promise<DumpItem> {
  const db = getDB();
  const order = (await db.dumpItems.count()) + 1;
  const item: DumpItem = {
    id: nanoid(),
    text: text.trim(),
    createdAt: Date.now(),
    order,
  };
  await db.dumpItems.add(item);
  return item;
}

export async function deleteDumpItem(id: string): Promise<void> {
  await getDB().dumpItems.delete(id);
}

export async function deleteDumpItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await getDB().dumpItems.bulkDelete(ids);
}

export async function deleteAllDumpItems(): Promise<void> {
  await getDB().dumpItems.clear();
}

export async function reorderDumpItems(ids: string[]): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.dumpItems, async () => {
    await Promise.all(
      ids.map((id, i) => db.dumpItems.update(id, { order: i + 1 })),
    );
  });
}

export async function promoteDumpToTask(
  id: string,
  overrides?: {
    priority?: Priority;
    due?: string;
    estimateMin?: number;
    labelIds?: string[];
  },
): Promise<string | undefined> {
  const db = getDB();
  const item = await db.dumpItems.get(id);
  if (!item) return undefined;
  const task = await createTask({
    title: item.text,
    priority: overrides?.priority,
    due: overrides?.due,
    estimateMin: overrides?.estimateMin,
  });
  if (overrides?.labelIds && overrides.labelIds.length > 0) {
    await db.tasks.update(task.id, { labelIds: overrides.labelIds });
  }
  await db.dumpItems.delete(id);
  return task.id;
}

export async function demoteTaskToDump(taskId: string): Promise<void> {
  const db = getDB();
  const task = await db.tasks.get(taskId);
  if (!task) return;
  const order = (await db.dumpItems.count()) + 1;
  await db.transaction("rw", db.tasks, db.dumpItems, async () => {
    await db.dumpItems.add({
      id: nanoid(),
      text: task.title,
      createdAt: Date.now(),
      order,
    });
    await db.tasks.delete(taskId);
  });
}
