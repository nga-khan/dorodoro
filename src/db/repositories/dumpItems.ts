"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import { createTask } from "@/db/repositories/tasks";
import type { DumpItem } from "@/types/domain";

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

export async function reorderDumpItems(ids: string[]): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.dumpItems, async () => {
    await Promise.all(
      ids.map((id, i) => db.dumpItems.update(id, { order: i + 1 })),
    );
  });
}

export async function promoteDumpToTask(id: string): Promise<void> {
  const db = getDB();
  const item = await db.dumpItems.get(id);
  if (!item) return;
  const task = await createTask({ title: item.text });
  await db.dumpItems.update(id, { promotedTaskId: task.id });
}
