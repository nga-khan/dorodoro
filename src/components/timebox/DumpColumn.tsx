"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FiCheckSquare, FiInbox, FiSquare, FiTrash2 } from "react-icons/fi";
import { useDumpItems } from "@/db/hooks";
import {
  createDumpItem,
  deleteAllDumpItems,
  deleteDumpItem,
  deleteDumpItems,
  promoteDumpToTask,
} from "@/db/repositories/dumpItems";
import { cn } from "@/lib/cn";
import { useCommand } from "@/lib/shortcuts/bus";
import { formatDumpTime } from "@/lib/time";
import type { DumpItem } from "@/types/domain";
import { DumpPromoteModal } from "./DumpPromoteModal";

export function DumpColumn() {
  const items = useDumpItems();
  const [text, setText] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [promoteTarget, setPromoteTarget] = useState<DumpItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useCommand(
    "focus-dump",
    useCallback(() => inputRef.current?.focus(), []),
  );

  useEffect(() => {
    if (!selectMode && selected.size > 0) setSelected(new Set());
  }, [selectMode, selected.size]);

  const submit = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    await createDumpItem(v);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteAll = async () => {
    if (items.length === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("덤프 전체를 삭제할까요?")
    )
      return;
    await deleteAllDumpItems();
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`선택한 ${selected.size}개 항목을 삭제할까요?`)
    )
      return;
    await deleteDumpItems(Array.from(selected));
    setSelected(new Set());
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
        className="mb-2 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink-2)]"
      />
      <div className="mb-3 flex items-center justify-between gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => setSelectMode((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors",
            selectMode
              ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
              : "border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--bg-0)]",
          )}
          aria-pressed={selectMode}
        >
          {selectMode ? (
            <FiCheckSquare aria-hidden />
          ) : (
            <FiSquare aria-hidden />
          )}
          {selectMode ? "선택 종료" : "선택"}
        </button>
        {selectMode ? (
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2 py-1 text-[var(--danger-ink)] disabled:opacity-40"
          >
            <FiTrash2 aria-hidden />
            선택 삭제 ({selected.size})
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2 py-1 text-[var(--danger-ink)] disabled:opacity-40"
          >
            <FiTrash2 aria-hidden />
            전체 삭제
          </button>
        )}
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className={cn(
                  "group flex items-start justify-between gap-2 rounded-lg border bg-[var(--bg-0)] px-3 py-2 text-sm",
                  isSelected ? "border-[var(--ink-0)]" : "border-[var(--line)]",
                )}
              >
                {selectMode && (
                  <button
                    type="button"
                    onClick={() => toggleSelected(item.id)}
                    aria-pressed={isSelected}
                    aria-label="선택"
                    className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--line-strong)] text-[var(--bg-0)]"
                    style={
                      isSelected
                        ? {
                            background: "var(--ink-0)",
                            borderColor: "var(--ink-0)",
                          }
                        : undefined
                    }
                  >
                    {isSelected && <span aria-hidden>✓</span>}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={
                      item.promotedTaskId
                        ? "line-through text-[var(--ink-3)]"
                        : ""
                    }
                  >
                    {item.text}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-[var(--ink-3)]">
                    {formatDumpTime(item.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.promotedTaskId && !selectMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        if (e.shiftKey) {
                          void promoteDumpToTask(item.id);
                          return;
                        }
                        setPromoteTarget(item);
                      }}
                      title="클릭: 분류 후 승격 · Shift+클릭: 바로 승격"
                      className="rounded-md border border-[var(--line)] px-2 py-1 text-[11px] text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
                    >
                      Task로
                    </button>
                  )}
                  {!selectMode && (
                    <button
                      type="button"
                      onClick={() => deleteDumpItem(item.id)}
                      className="rounded-md px-2 py-1 text-[11px] text-[var(--ink-3)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-ink)]"
                      aria-label="삭제"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--ink-3)]">
            아직 비어 있어요. 떠오르는 생각을 그냥 적어보세요.
          </li>
        )}
      </ul>
      <DumpPromoteModal
        item={promoteTarget}
        onClose={() => setPromoteTarget(null)}
      />
    </div>
  );
}
