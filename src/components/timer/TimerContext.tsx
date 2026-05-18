"use client";

import { createContext, useContext, useState } from "react";
import { useSettings } from "@/db/hooks";
import { useTimerEngine } from "./useTimerEngine";

type TimerEngine = ReturnType<typeof useTimerEngine>;

interface TimerContextValue extends TimerEngine {
  manualMinutes: number;
  setManualMinutes: (m: number) => void;
}

const TimerCtx = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const [manualMinutes, setManualMinutes] = useState(25);
  const engine = useTimerEngine({ settings, manualMinutes });
  return (
    <TimerCtx.Provider value={{ ...engine, manualMinutes, setManualMinutes }}>
      {children}
    </TimerCtx.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerCtx);
  if (!ctx) throw new Error("useTimer must be used inside <TimerProvider>");
  return ctx;
}
