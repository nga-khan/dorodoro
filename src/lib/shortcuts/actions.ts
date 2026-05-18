"use client";

import { useAppStore } from "@/stores/app";
import { dispatchCommand } from "./bus";

export type ActionId =
  | "open-palette"
  | "open-help"
  | "escape"
  | "go-timer"
  | "go-timebox"
  | "go-calendar"
  | "go-futureback"
  | "create-task"
  | "create-event"
  | "focus-dump"
  | "timer-start"
  | "timer-toggle"
  | "delete-selected";

export type ActionGroup =
  | "navigation"
  | "create"
  | "session"
  | "selection"
  | "app";

export interface ActionDef {
  id: ActionId;
  label: string;
  group: ActionGroup;
  keys: string[];
  danger?: boolean;
  hint?: string;
}

export const GROUP_LABEL: Record<ActionGroup, string> = {
  app: "앱",
  navigation: "이동",
  create: "생성",
  session: "세션",
  selection: "선택",
};

export const ACTIONS: ActionDef[] = [
  { id: "open-palette", label: "명령 팔레트", group: "app", keys: ["⌘", "P"] },
  { id: "open-help", label: "단축키 가이드", group: "app", keys: ["?"] },

  {
    id: "go-timer",
    label: "타이머로 이동",
    group: "navigation",
    keys: ["G", "T"],
    hint: "또는 1",
  },
  {
    id: "go-timebox",
    label: "타임박싱으로 이동",
    group: "navigation",
    keys: ["G", "B"],
    hint: "또는 2",
  },
  {
    id: "go-calendar",
    label: "캘린더로 이동",
    group: "navigation",
    keys: ["G", "C"],
    hint: "또는 3",
  },
  {
    id: "go-futureback",
    label: "퓨쳐백으로 이동",
    group: "navigation",
    keys: ["G", "F"],
    hint: "또는 4",
  },

  {
    id: "create-task",
    label: "새 Task 생성",
    group: "create",
    keys: ["C", "T"],
  },
  {
    id: "create-event",
    label: "새 일정 생성",
    group: "create",
    keys: ["C", "E"],
  },
  {
    id: "focus-dump",
    label: "Dump에 입력",
    group: "create",
    keys: ["C", "D"],
  },

  {
    id: "timer-start",
    label: "타이머 시작",
    group: "session",
    keys: ["C", "S"],
  },
  {
    id: "timer-toggle",
    label: "타이머 일시정지/재개",
    group: "session",
    keys: ["S", "S"],
  },

  {
    id: "delete-selected",
    label: "선택 항목 삭제",
    group: "selection",
    keys: ["D", "D"],
    danger: true,
  },
];

const ACTION_BY_ID = Object.fromEntries(
  ACTIONS.map((a) => [a.id, a]),
) as Record<ActionId, ActionDef>;

export function getAction(id: ActionId): ActionDef {
  return ACTION_BY_ID[id];
}

export function runAction(id: ActionId) {
  const app = useAppStore.getState();
  switch (id) {
    case "open-palette":
      app.setShortcutsHelpOpen(false);
      app.setCommandPaletteOpen(true);
      return;
    case "open-help":
      app.setCommandPaletteOpen(false);
      app.setShortcutsHelpOpen(!app.shortcutsHelpOpen);
      return;
    case "escape":
      if (app.commandPaletteOpen) {
        app.setCommandPaletteOpen(false);
        return;
      }
      if (app.shortcutsHelpOpen) {
        app.setShortcutsHelpOpen(false);
        return;
      }
      return;
    case "go-timer":
      app.setActiveTab("timer");
      return;
    case "go-timebox":
      app.setActiveTab("timebox");
      return;
    case "go-calendar":
      app.setActiveTab("calendar");
      return;
    case "go-futureback":
      app.setActiveTab("futureback");
      return;
    case "create-task":
      app.setActiveTab("timebox");
      setTimeout(() => dispatchCommand("focus-new-task"), 220);
      return;
    case "create-event":
      app.setActiveTab("calendar");
      setTimeout(() => dispatchCommand("open-event-editor"), 220);
      return;
    case "focus-dump":
      app.setActiveTab("timebox");
      setTimeout(() => dispatchCommand("focus-dump"), 220);
      return;
    case "timer-start":
      app.setActiveTab("timer");
      setTimeout(() => dispatchCommand("timer-start"), 220);
      return;
    case "timer-toggle":
      dispatchCommand("timer-toggle");
      return;
    case "delete-selected":
      dispatchCommand("delete-selected");
      return;
  }
}
