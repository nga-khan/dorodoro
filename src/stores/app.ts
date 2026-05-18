"use client";

import { create } from "zustand";

export type TabKey = "timer" | "timebox" | "calendar" | "futureback";
export type CalendarView = "day" | "week" | "month" | "year";
export type TaskBoardView = "list" | "timeline";
export type MobileTimeboxPane = "dump" | "tasks" | "progress";

type AppState = {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;

  calendarView: CalendarView;
  setCalendarView: (v: CalendarView) => void;

  calendarCursor: number; // epoch ms, midnight of focused day
  setCalendarCursor: (ms: number) => void;

  taskBoardView: TaskBoardView;
  setTaskBoardView: (v: TaskBoardView) => void;

  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  mobileTimeboxPane: MobileTimeboxPane;
  setMobileTimeboxPane: (p: MobileTimeboxPane) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (b: boolean) => void;

  shortcutsHelpOpen: boolean;
  setShortcutsHelpOpen: (b: boolean) => void;
};

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: "timer",
  setActiveTab: (t) => set({ activeTab: t }),

  calendarView: "week",
  setCalendarView: (v) => set({ calendarView: v }),

  calendarCursor: todayStart(),
  setCalendarCursor: (ms) => set({ calendarCursor: ms }),

  taskBoardView: "list",
  setTaskBoardView: (v) => set({ taskBoardView: v }),

  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),

  mobileTimeboxPane: "tasks",
  setMobileTimeboxPane: (p) => set({ mobileTimeboxPane: p }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (b) => set({ commandPaletteOpen: b }),

  shortcutsHelpOpen: false,
  setShortcutsHelpOpen: (b) => set({ shortcutsHelpOpen: b }),
}));
