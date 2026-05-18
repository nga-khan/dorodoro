"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import type { Priority, Task, TaskStatus } from "@/types/domain";

const now = () => Date.now();

export async function createTask(input: {
  title: string;
  priority?: Priority;
  status?: TaskStatus;
  parentId?: string;
  start?: number;
  end?: number;
  color?: string;
  description?: string;
}): Promise<Task> {
  const db = getDB();
  const order = (await db.tasks.count()) + 1;
  const task: Task = {
    id: nanoid(),
    title: input.title.trim() || "(제목 없음)",
    description: input.description,
    priority: input.priority ?? 3,
    status: input.status ?? "todo",
    parentId: input.parentId,
    start: input.start,
    end: input.end,
    color: input.color,
    createdAt: now(),
    updatedAt: now(),
    order,
  };
  await db.tasks.add(task);
  return task;
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<Task, "id" | "createdAt">>,
): Promise<void> {
  await getDB().tasks.update(id, { ...patch, updatedAt: now() });
}

export async function deleteTask(id: string): Promise<void> {
  await getDB().tasks.delete(id);
}

export async function reorderTasks(orderedIds: string[]): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.tasks, async () => {
    await Promise.all(
      orderedIds.map((id, i) =>
        db.tasks.update(id, { order: i + 1, updatedAt: now() }),
      ),
    );
  });
}

export async function toggleTaskStatus(id: string): Promise<void> {
  const db = getDB();
  const t = await db.tasks.get(id);
  if (!t) return;
  const next: TaskStatus = t.status === "done" ? "todo" : "done";
  await db.tasks.update(id, { status: next, updatedAt: now() });
}
