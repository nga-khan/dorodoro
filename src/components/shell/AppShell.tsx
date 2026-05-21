"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { IconType } from "react-icons";
import { FiCalendar, FiClock, FiGrid, FiTarget } from "react-icons/fi";
import { CalendarView } from "@/components/calendar/CalendarView";
import { FutureBackView } from "@/components/futureback/FutureBackView";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { HelpButton } from "@/components/shell/HelpButton";
import { Logo } from "@/components/shell/Logo";
import { SettingsMenu } from "@/components/shell/SettingsMenu";
import { ShortcutsHelpModal } from "@/components/shell/ShortcutsHelpModal";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { TimeboxView } from "@/components/timebox/TimeboxView";
import { FloatingTimer } from "@/components/timer/FloatingTimer";
import { TimerProvider } from "@/components/timer/TimerContext";
import { TimerPanel } from "@/components/timer/TimerPanel";
import { cn } from "@/lib/cn";
import { useShortcutEngine } from "@/lib/shortcuts/useShortcutEngine";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useReminders } from "@/lib/useReminders";
import { type TabKey, useAppStore } from "@/stores/app";
import { useSystemStore } from "@/stores/system";

const TABS: { key: TabKey; label: string; Icon: IconType }[] = [
  { key: "timer", label: "타이머", Icon: FiClock },
  { key: "timebox", label: "타임박싱", Icon: FiGrid },
  { key: "calendar", label: "캘린더", Icon: FiCalendar },
  { key: "futureback", label: "퓨쳐백", Icon: FiTarget },
];

export function AppShell() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const lastTab = useSystemStore((s) => s.lastTab);
  const setLastTab = useSystemStore((s) => s.setLastTab);

  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (lastTab && lastTab !== activeTab) setActiveTab(lastTab);
  }, [lastTab, activeTab, setActiveTab]);

  useEffect(() => {
    setLastTab(activeTab);
  }, [activeTab, setLastTab]);

  useShortcutEngine();

  return (
    <TimerProvider>
      <AppShellInner />
    </TimerProvider>
  );
}

function AppShellInner() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const isMobile = useMediaQuery("(max-width: 768px)");
  useReminders();

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[var(--bg-0)] text-[var(--ink-0)]">
      {!isMobile && (
        <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg-0)]/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Logo height={24} priority />
              <span className="font-mono text-sm tracking-tight text-[var(--ink-1)]">
                doro-doro
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-3)]">
                powered by NGA
              </span>
            </div>
            <div className="flex items-center gap-3">
              <nav className="flex gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-1)] p-1">
                {TABS.map((t) => {
                  const active = activeTab === t.key;
                  const Icon = t.Icon;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      className={cn(
                        "relative px-4 py-1.5 text-sm rounded-full transition-colors",
                        active
                          ? "text-[var(--bg-0)]"
                          : "text-[var(--ink-2)] hover:text-[var(--ink-0)]",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="tabIndicator"
                          className="absolute inset-0 rounded-full bg-[var(--ink-0)]"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      )}
                      <span className="relative flex items-center gap-1.5">
                        <Icon aria-hidden className="text-[13px]" />
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
              <div className="flex items-center gap-2">
                <HelpButton />
                <ThemeToggle />
                <SettingsMenu />
              </div>
            </div>
          </div>
        </header>
      )}

      {isMobile && (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-0)]/90 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <Logo height={20} priority />
            <span className="font-mono text-sm tracking-tight text-[var(--ink-1)]">
              doro-doro
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton />
            <ThemeToggle />
            <SettingsMenu />
          </div>
        </header>
      )}

      <main
        className={cn(
          "flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-6",
          isMobile && "pb-[calc(72px+var(--safe-bottom))]",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full"
          >
            {activeTab === "timer" && <TimerPanel />}
            {activeTab === "timebox" && <TimeboxView />}
            {activeTab === "calendar" && <CalendarView />}
            {activeTab === "futureback" && <FutureBackView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {isMobile && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg-0)]/95 backdrop-blur"
          style={{ paddingBottom: "var(--safe-bottom)" }}
        >
          <div className="flex">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              const Icon = t.Icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "relative flex-1 flex flex-col items-center gap-1 py-3 text-[11px]",
                    active ? "text-[var(--ink-0)]" : "text-[var(--ink-3)]",
                  )}
                >
                  <Icon aria-hidden className="text-lg" />
                  <span>{t.label}</span>
                  {active && (
                    <motion.span
                      layoutId="tabIndicatorMobile"
                      className="absolute top-0 h-[2px] w-8 rounded-full bg-[var(--ink-0)]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <FloatingTimer />
      <CommandPalette />
      <ShortcutsHelpModal />
    </div>
  );
}
