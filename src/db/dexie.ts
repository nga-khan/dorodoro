"use client";

import Dexie, { type Table } from "dexie";
import type {
  CalendarEvent,
  DumpItem,
  Goal,
  Label,
  PeriodReflection,
  PomodoroSession,
  Settings,
  Task,
  TaskTemplate,
} from "@/types/domain";

class DoroDB extends Dexie {
  tasks!: Table<Task, string>;
  dumpItems!: Table<DumpItem, string>;
  events!: Table<CalendarEvent, string>;
  sessions!: Table<PomodoroSession, string>;
  settings!: Table<Settings, string>;
  taskTemplates!: Table<TaskTemplate, string>;
  goals!: Table<Goal, string>;
  labels!: Table<Label, string>;
  periodReflections!: Table<PeriodReflection, string>;

  constructor() {
    super("doro-doro");
    this.version(1).stores({
      tasks: "id, status, priority, start, parentId, order, updatedAt",
      dumpItems: "id, order, createdAt",
      events: "id, start, updatedAt",
      sessions: "id, startedAt, taskId, phase",
      settings: "id",
    });
    this.version(2).stores({
      taskTemplates: "id, updatedAt, name",
    });
    this.version(3).stores({
      // rrule is stored on the event itself; indexed `start` still serves
      // non-recurring queries. Recurring events are expanded at read time.
      events: "id, start, updatedAt",
    });
    this.version(4).stores({
      goals: "id, targetDate, status, updatedAt",
    });
    this.version(5).stores({
      labels: "id, name, createdAt",
    });
    this.version(6)
      .stores({
        goals: "id, targetDate, status, updatedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("goals")
          .toCollection()
          .modify((g: { checkpoints?: unknown }) => {
            if (!Array.isArray(g.checkpoints)) g.checkpoints = [];
          });
      });
    this.version(7).stores({
      periodReflections: "id, [period+anchor], updatedAt",
    });
  }
}

let _db: DoroDB | null = null;

export function getDB(): DoroDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie can only be used in the browser");
  }
  if (!_db) _db = new DoroDB();
  return _db;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "singleton",
  timerColor: "#111111",
  cycleEnabled: false,
  cycle: { workMin: 25, shortMin: 5, longMin: 15, setsBeforeLong: 4 },
  theme: "system",
};
