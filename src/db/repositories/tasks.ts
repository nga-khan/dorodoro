"use client";

import { nanoid } from "nanoid";
import { getDB } from "@/db/dexie";
import { nextDueKey, nextOccurrenceAfter } from "@/lib/taskRecurrence";
import type {
  Priority,
  RecurrenceRule,
  Task,
  TaskStatus,
} from "@/types/domain";

const now = () => Date.now();

export async function createTask(input: {
  title: string;
  priority?: Priority;
  status?: TaskStatus;
  parentId?: string;
  start?: number;
  end?: number;
  due?: string;
  estimateMin?: number;
  rrule?: RecurrenceRule;
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
    due: input.due,
    estimateMin: input.estimateMin,
    rrule: input.rrule,
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

/**
 * Move a task to the end of a status lane. Cheap path for cross-lane drops.
 */
export async function moveTaskToStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const db = getDB();
  const t = await db.tasks.get(id);
  if (!t || t.status === status) {
    if (t && t.status !== status) {
      await db.tasks.update(id, { status, updatedAt: now() });
    }
    return;
  }
  const peers = await db.tasks.where("status").equals(status).toArray();
  const maxOrder = peers.reduce((m, p) => (p.order > m ? p.order : m), 0);
  await db.tasks.update(id, {
    status,
    order: maxOrder + 1,
    updatedAt: now(),
  });
  if (status === "done" && t.rrule) {
    await spawnNextRecurrence(t);
  }
}

export async function toggleTaskStatus(id: string): Promise<void> {
  const db = getDB();
  const t = await db.tasks.get(id);
  if (!t) return;
  const next: TaskStatus = t.status === "done" ? "todo" : "done";
  await db.tasks.update(id, { status: next, updatedAt: now() });
  // On completion, if the task has a recurrence rule, generate the next
  // occurrence as a fresh todo task. The completed task is kept as history.
  if (next === "done" && t.rrule) {
    await spawnNextRecurrence(t);
  }
}

async function spawnNextRecurrence(t: Task): Promise<void> {
  if (!t.rrule) return;
  const db = getDB();
  // Prefer due-driven recurrence; fall back to start.
  let nextDue: string | undefined;
  let nextStart: number | undefined;
  let nextEnd: number | undefined;
  if (t.due) {
    const nd = nextDueKey(t.due, t.rrule);
    if (!nd) return;
    nextDue = nd;
  }
  if (t.start != null) {
    const base = new Date(t.start);
    const n = nextOccurrenceAfter(base, t.rrule);
    if (!n) {
      if (!nextDue) return;
    } else {
      const delta = n.getTime() - t.start;
      nextStart = n.getTime();
      if (t.end != null) nextEnd = t.end + delta;
    }
  }
  if (nextDue == null && nextStart == null) return;
  const order = (await db.tasks.count()) + 1;
  const fresh: Task = {
    id: nanoid(),
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: "todo",
    parentId: t.parentId,
    start: nextStart,
    end: nextEnd,
    due: nextDue,
    estimateMin: t.estimateMin,
    rrule: t.rrule,
    color: t.color,
    labelIds: t.labelIds,
    createdAt: now(),
    updatedAt: now(),
    order,
  };
  await db.tasks.add(fresh);
}
