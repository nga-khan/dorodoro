"use client";

import { getDB } from "@/db/dexie";

export async function deleteAllData(): Promise<void> {
  const db = getDB();
  await db.transaction(
    "rw",
    [
      db.tasks,
      db.dumpItems,
      db.events,
      db.sessions,
      db.taskTemplates,
      db.goals,
    ],
    async () => {
      await Promise.all([
        db.tasks.clear(),
        db.dumpItems.clear(),
        db.events.clear(),
        db.sessions.clear(),
        db.taskTemplates.clear(),
        db.goals.clear(),
      ]);
    },
  );
}
