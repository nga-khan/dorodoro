export type ID = string;

export type Priority = 1 | 2 | 3 | 4; // 1 = highest
export type TaskStatus = "todo" | "doing" | "done";

export interface Label {
  id: ID;
  name: string;
  color: string;
  createdAt: number;
}
export type Satisfaction = "low" | "mid" | "high";
export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export interface Task {
  id: ID;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  parentId?: ID;
  start?: number;
  end?: number;
  color?: string;
  labelIds?: ID[];
  createdAt: number;
  updatedAt: number;
  order: number;
}

export interface DumpItem {
  id: ID;
  text: string;
  createdAt: number;
  order: number;
  promotedTaskId?: ID;
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number; // default 1
  byweekday?: Weekday[]; // weekly only
  until?: number; // ms, inclusive
  count?: number; // occurrences cap (use either until or count, not both)
}

export interface PreAction {
  id: ID;
  title: string;
  done: boolean;
}

export interface CalendarEvent {
  id: ID;
  title: string;
  description?: string;
  start: number;
  end: number;
  color?: string;
  labelIds?: ID[];
  createdAt: number;
  updatedAt: number;
  rrule?: RecurrenceRule;
  exDates?: number[]; // excluded occurrence start times (ms)
  preActions?: PreAction[];
}

export interface SessionReflection {
  note: string;
  satisfaction: Satisfaction;
  recordedAt: number;
}

export interface PomodoroSession {
  id: ID;
  startedAt: number;
  endedAt?: number;
  plannedMs: number;
  phase: PomodoroPhase;
  taskId?: ID;
  completed: boolean;
  reflection?: SessionReflection;
}

export type ReflectionPeriod = "weekly" | "monthly" | "yearly";

export interface PeriodReflection {
  id: ID;
  period: ReflectionPeriod;
  anchor: number;
  wentWell?: string;
  improvements?: string;
  nextActions?: string;
  satisfaction?: Satisfaction;
  createdAt: number;
  updatedAt: number;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  perPhase: {
    work: boolean;
    shortBreak: boolean;
    longBreak: boolean;
  };
}

export interface Settings {
  id: "singleton";
  timerColor: string;
  cycleEnabled: boolean;
  cycle: {
    workMin: number;
    shortMin: number;
    longMin: number;
    setsBeforeLong: number;
  };
  theme: "system" | "light" | "dark";
  notifications: NotificationSettings;
}

export type CalendarItem =
  | { kind: "task"; data: Task }
  | { kind: "event"; data: CalendarEvent };

export interface TaskTemplateItem {
  title: string;
  priority: Priority;
  estimateMin?: number;
}

export interface TaskTemplate {
  id: ID;
  name: string;
  items: TaskTemplateItem[];
  createdAt: number;
  updatedAt: number;
}

export interface KeyResult {
  id: ID;
  title: string;
  metric?: string;
  target?: number;
  current?: number;
}

export interface Kpi {
  id: ID;
  title: string;
  unit?: string;
  target?: number;
  current?: number;
}

export type GoalStatus = "active" | "achieved" | "archived" | "failed";

export interface CheckpointActionItem {
  id: ID;
  text: string;
  done: boolean;
  taskId?: ID;
}

export interface Checkpoint {
  id: ID;
  title: string;
  date: number;
  criteria?: string;
  done: boolean;
  actionItems?: CheckpointActionItem[];
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: ID;
  title: string;
  targetDate: number;
  rationale?: string;
  obstacles?: string;
  plan?: string;
  objective: string;
  keyResults: KeyResult[];
  kpis: Kpi[];
  checkpoints: Checkpoint[];
  status: GoalStatus;
  labelIds?: ID[];
  createdAt: number;
  updatedAt: number;
}
