"use client";

import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { useDumpItems } from "@/db/hooks";
import {
  createDumpItem,
  deleteDumpItem,
  promoteDumpToTask,
} from "@/db/repositories/dumpItems";
import { useCommand } from "@/lib/shortcuts/bus";

export function DumpColumn() {
  const items = useDumpItems();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useCommand(
    "focus-dump",
    useCallback(() => inputRef.current?.focus(), []),
  );

  const submit = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    await createDumpItem(v);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter 는 입력 확정용이므로 새 항목으로 처리하지 않는다.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
      <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        <FiInbox aria-hidden className="text-[11px]" />
        Dump
      </div>
      <h3 className="mb-3 text-base font-medium tracking-tight">
        머릿속 비우기
      </h3>
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="떠오르는 모든 것을 적어보세요"
        className="mb-3 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink-2)]"
      />
      <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="group flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-0)] px-3 py-2 text-sm"
            >
              <span
                className={
                  item.promotedTaskId ? "line-through text-[var(--ink-3)]" : ""
                }
              >
                {item.text}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!item.promotedTaskId && (
                  <button
                    type="button"
                    onClick={() => promoteDumpToTask(item.id)}
                    className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
                  >
                    Task로
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteDumpItem(item.id)}
                  className="rounded-md px-2 py-1 text-[11px] text-[var(--ink-3)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-ink)]"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--ink-3)]">
            아직 비어 있어요. 떠오르는 생각을 그냥 적어보세요.
          </li>
        )}
      </ul>
    </div>
  );
}
