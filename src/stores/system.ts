"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TabKey } from "./app";

type FloatPos = { x: number; y: number };

type SystemState = {
  theme: "system" | "light" | "dark";
  setTheme: (t: SystemState["theme"]) => void;
  lastTab: TabKey;
  setLastTab: (t: TabKey) => void;
  floatPos: FloatPos | null;
  setFloatPos: (p: FloatPos) => void;
};

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (t) => set({ theme: t }),
      lastTab: "timer",
      setLastTab: (t) => set({ lastTab: t }),
      floatPos: null,
      setFloatPos: (p) => set({ floatPos: p }),
    }),
    { name: "doro-doro/system" },
  ),
);
