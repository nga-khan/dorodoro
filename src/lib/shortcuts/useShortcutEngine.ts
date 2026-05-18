"use client";

import { useEffect, useRef } from "react";
import { type ActionId, runAction } from "./actions";

const SEQUENCE_TIMEOUT_MS = 1200;

type SeqMap = Record<string, Record<string, ActionId>>;

const SEQUENCES: SeqMap = {
  g: {
    t: "go-timer",
    b: "go-timebox",
    c: "go-calendar",
    f: "go-futureback",
  },
  c: {
    t: "create-task",
    e: "create-event",
    d: "focus-dump",
    s: "timer-start",
  },
  s: { s: "timer-toggle" },
  d: { d: "delete-selected" },
};

const SINGLE: Record<string, ActionId> = {
  "?": "open-help",
  "1": "go-timer",
  "2": "go-timebox",
  "3": "go-calendar",
  "4": "go-futureback",
};

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}

export function useShortcutEngine() {
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearPending = () => {
      pendingRef.current = null;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + P / K → palette (works even from inputs).
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        !e.shiftKey &&
        (e.key === "p" || e.key === "k" || e.key === "P" || e.key === "K")
      ) {
        e.preventDefault();
        runAction("open-palette");
        clearPending();
        return;
      }

      // Escape always — let action handler decide.
      if (e.key === "Escape") {
        runAction("escape");
        clearPending();
        return;
      }

      // Skip if typing or other modifiers held.
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // Continue an active sequence?
      if (pendingRef.current) {
        const next = SEQUENCES[pendingRef.current]?.[key.toLowerCase()];
        clearPending();
        if (next) {
          e.preventDefault();
          runAction(next);
        }
        return;
      }

      // Single key?
      const single = SINGLE[key];
      if (single) {
        e.preventDefault();
        runAction(single);
        return;
      }

      // Start a sequence?
      const lower = key.toLowerCase();
      if (SEQUENCES[lower]) {
        pendingRef.current = lower;
        timerRef.current = window.setTimeout(clearPending, SEQUENCE_TIMEOUT_MS);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);
}
