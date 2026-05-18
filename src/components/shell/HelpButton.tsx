"use client";

import { FiHelpCircle } from "react-icons/fi";
import { useAppStore } from "@/stores/app";

export function HelpButton() {
  const open = useAppStore((s) => s.shortcutsHelpOpen);
  const setOpen = useAppStore((s) => s.setShortcutsHelpOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-label="단축키 가이드"
      aria-expanded={open}
      title="단축키 가이드 (?)"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-1)] hover:bg-[var(--bg-1)]"
    >
      <FiHelpCircle aria-hidden />
    </button>
  );
}
