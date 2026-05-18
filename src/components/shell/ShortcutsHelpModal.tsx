"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  ACTIONS,
  type ActionDef,
  type ActionGroup,
  GROUP_LABEL,
} from "@/lib/shortcuts/actions";
import { useAppStore } from "@/stores/app";

const GROUP_ORDER: ActionGroup[] = [
  "app",
  "navigation",
  "create",
  "session",
  "selection",
];

function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/i.test(navigator.platform);
}

export function ShortcutsHelpModal() {
  const open = useAppStore((s) => s.shortcutsHelpOpen);
  const setOpen = useAppStore((s) => s.setShortcutsHelpOpen);
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(isMac()), []);

  const grouped: Record<ActionGroup, ActionDef[]> = {
    app: [],
    navigation: [],
    create: [],
    session: [],
    selection: [],
  };
  for (const a of ACTIONS) grouped[a.group].push(a);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-4 pt-[10vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-6 shadow-[var(--shadow-card)]"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
                  Shortcuts
                </div>
                <h2 className="mt-1 text-lg font-medium tracking-tight">
                  키보드 단축키
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-2)]">
                  Linear식 시퀀스 단축키. 첫 키를 누르고 1.2초 안에 다음 키를
                  누르세요. <Kbd>⌘</Kbd>
                  <span className="mx-1 text-[var(--ink-3)]">+</span>
                  <Kbd>P</Kbd>로 명령 팔레트를 열 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-[var(--ink-3)] hover:text-[var(--ink-0)]"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {GROUP_ORDER.map((g) => (
                <section key={g}>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
                    {GROUP_LABEL[g]}
                  </div>
                  <ul className="space-y-1.5">
                    {grouped[g].map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-[var(--bg-1)]"
                      >
                        <span
                          className={cn(
                            "text-sm",
                            a.danger
                              ? "text-[var(--danger-ink)]"
                              : "text-[var(--ink-1)]",
                          )}
                        >
                          {a.label}
                          {a.hint && (
                            <span className="ml-1 text-[10px] text-[var(--ink-3)]">
                              {a.hint}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          {a.keys.map((k, i) => (
                            <Kbd key={`${a.id}-${i}-${k}`}>
                              {k === "⌘" && !mac ? "Ctrl" : k}
                            </Kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--bg-1)] p-3 text-xs text-[var(--ink-2)]">
              팁: 입력란에 포커스가 있으면 단축키는 비활성화됩니다.{" "}
              <Kbd>Esc</Kbd>로 모든 모달을 닫을 수 있습니다.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ink-1)]">
      {children}
    </kbd>
  );
}
