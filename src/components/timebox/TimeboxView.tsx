"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useAppStore } from "@/stores/app";
import { DumpColumn } from "./DumpColumn";
import { ProgressDash } from "./ProgressDash";
import { TaskBoard } from "./TaskBoard";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

const MOBILE_PANES = [
  { key: "dump", label: "Dump" },
  { key: "tasks", label: "Tasks" },
  { key: "progress", label: "진행" },
] as const;

export function TimeboxView() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pane = useAppStore((s) => s.mobileTimeboxPane);
  const setPane = useAppStore((s) => s.setMobileTimeboxPane);

  if (isMobile) {
    return (
      <section className="flex h-[calc(100vh-160px)] flex-col gap-3">
        <div className="flex gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-1)] p-1 text-xs">
          {MOBILE_PANES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPane(p.key)}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 transition-colors",
                pane === p.key
                  ? "bg-[var(--ink-0)] text-[var(--bg-0)]"
                  : "text-[var(--ink-2)]",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pane}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0"
            >
              {pane === "dump" && <DumpColumn />}
              {pane === "tasks" && <TaskBoard />}
              {pane === "progress" && <ProgressDash />}
            </motion.div>
          </AnimatePresence>
        </div>
        <TaskDetailDrawer />
      </section>
    );
  }

  return (
    <section className="grid h-[calc(100vh-160px)] grid-cols-2 grid-rows-[7fr_3fr] gap-3">
      <div className="row-span-2">
        <DumpColumn />
      </div>
      <div>
        <TaskBoard />
      </div>
      <div>
        <ProgressDash />
      </div>
      <TaskDetailDrawer />
    </section>
  );
}
