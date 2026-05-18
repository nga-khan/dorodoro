"use client";

import { useEffect, useRef, useState } from "react";
import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { useSettings } from "@/db/hooks";
import { updateSettings } from "@/db/repositories/settings";
import { cn } from "@/lib/cn";
import type { Settings } from "@/types/domain";

type Theme = Settings["theme"];

const ORDER: Theme[] = ["light", "dark", "system"];
const LABEL: Record<Theme, string> = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
};

function Icon({ theme }: { theme: Theme }) {
  if (theme === "light") return <FiSun aria-hidden />;
  if (theme === "dark") return <FiMoon aria-hidden />;
  return <FiMonitor aria-hidden />;
}

function resolveEffective(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

interface Props {
  variant?: "icon" | "menu";
  onAfter?: () => void;
}

export function ThemeToggle({ variant = "icon", onAfter }: Props) {
  const settings = useSettings();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const theme = settings.theme;
  const next: Theme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  // Resolve only after mount to avoid SSR/client mismatch on system theme.
  const effective = mounted ? resolveEffective(theme) : null;

  const apply = async () => {
    const target: Theme = next;
    // Circular reveal via View Transitions API, fallback: instant swap.
    const supports =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      typeof (
        document as Document & {
          startViewTransition?: (cb: () => void) => unknown;
        }
      ).startViewTransition === "function";
    if (!supports) {
      await updateSettings({ theme: target });
      onAfter?.();
      return;
    }
    const btn = btnRef.current;
    const rect = btn?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const r = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const tx = (
      document as Document & {
        startViewTransition: (cb: () => void | Promise<void>) => {
          ready: Promise<void>;
        };
      }
    ).startViewTransition(async () => {
      await updateSettings({ theme: target });
    });
    try {
      await tx.ready;
      const goingDark =
        target === "dark" ||
        (target === "system" && resolveEffective("system") === "dark");
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0 at ${x}px ${y}px)`,
            `circle(${r}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: "ease-in-out",
          pseudoElement: goingDark
            ? "::view-transition-new(root)"
            : "::view-transition-new(root)",
        },
      );
    } catch {
      /* ignore animate failures */
    }
    onAfter?.();
  };

  if (variant === "menu") {
    return (
      <button
        ref={btnRef}
        type="button"
        onClick={apply}
        className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-[var(--bg-1)]"
      >
        <span className="flex items-center gap-2">
          <Icon theme={theme} />
          테마 — {LABEL[theme]}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
          {LABEL[next]}로
        </span>
      </button>
    );
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={apply}
      aria-label={`테마 전환 (현재 ${LABEL[theme]})`}
      title={
        effective
          ? `테마 — ${LABEL[theme]} (${effective})`
          : `테마 — ${LABEL[theme]}`
      }
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-1)] hover:bg-[var(--bg-1)]",
      )}
    >
      <Icon theme={theme} />
    </button>
  );
}
