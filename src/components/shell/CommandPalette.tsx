"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { cn } from "@/lib/cn";
import {
  ACTIONS,
  type ActionDef,
  GROUP_LABEL,
  runAction,
} from "@/lib/shortcuts/actions";
import { useAppStore } from "@/stores/app";

function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  // Subsequence match.
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items: ActionDef[] = ACTIONS.filter((a) =>
    fuzzyMatch(query, `${a.label} ${GROUP_LABEL[a.group]} ${a.keys.join(" ")}`),
  );

  useEffect(() => {
    if (cursor >= items.length) setCursor(Math.max(0, items.length - 1));
  }, [cursor, items.length]);

  const run = (a: ActionDef) => {
    setOpen(false);
    setTimeout(() => runAction(a.id), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(items.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const a = items[cursor];
      if (a) run(a);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
              <FiSearch aria-hidden className="text-[var(--ink-3)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="명령 또는 액션 검색…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ink-3)]"
              />
              <span className="text-[10px] text-[var(--ink-3)]">Esc</span>
            </div>
            <ul ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
              {items.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-[var(--ink-3)]">
                  결과 없음
                </li>
              )}
              {items.map((a, i) => {
                const active = i === cursor;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => run(a)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm",
                        active && "bg-[var(--bg-1)]",
                      )}
                    >
                      <span className="flex flex-col">
                        <span
                          className={
                            a.danger
                              ? "text-[var(--danger-ink)]"
                              : "text-[var(--ink-0)]"
                          }
                        >
                          {a.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                          {GROUP_LABEL[a.group]}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        {a.keys.map((k, ki) => (
                          <kbd
                            key={`${a.id}-pal-${ki}-${k}`}
                            className="inline-flex min-w-[22px] items-center justify-center rounded border border-[var(--line-strong)] bg-[var(--bg-1)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-1)]"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
