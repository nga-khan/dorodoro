"use client";

import { differenceInCalendarDays } from "date-fns";
import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiCircle,
  FiPlus,
  FiSend,
  FiTrash2,
} from "react-icons/fi";
import { cn } from "@/lib/cn";
import type { Checkpoint, CheckpointActionItem } from "@/types/domain";

function toLocalDate(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface Props {
  checkpoint: Checkpoint;
  isFirst: boolean;
  isLast: boolean;
  onPatch: (patch: Partial<Checkpoint>) => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onAddAction?: (text: string) => void;
  onPatchAction?: (
    itemId: string,
    patch: Partial<CheckpointActionItem>,
  ) => void;
  onDeleteAction?: (itemId: string) => void;
  onToggleAction?: (itemId: string) => void;
  onPromoteAction?: (itemId: string) => void;
}

export function CheckpointCard({
  checkpoint,
  isFirst,
  isLast,
  onPatch,
  onToggleDone,
  onDelete,
  onAddAction,
  onPatchAction,
  onDeleteAction,
  onToggleAction,
  onPromoteAction,
}: Props) {
  const [title, setTitle] = useState(checkpoint.title);
  const [criteria, setCriteria] = useState(checkpoint.criteria ?? "");
  const [newAction, setNewAction] = useState("");

  useEffect(() => setTitle(checkpoint.title), [checkpoint.title]);
  useEffect(
    () => setCriteria(checkpoint.criteria ?? ""),
    [checkpoint.criteria],
  );

  const d = differenceInCalendarDays(new Date(checkpoint.date), new Date());
  const dLabel = d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : `D+${-d}`;
  const tag = isFirst ? "NOW" : isLast ? "FINAL" : null;

  const commitTitle = () => {
    if (title !== checkpoint.title) onPatch({ title });
  };
  const commitCriteria = () => {
    if (criteria !== (checkpoint.criteria ?? "")) onPatch({ criteria });
  };

  const submitAction = () => {
    const t = newAction.trim();
    if (!t || !onAddAction) return;
    onAddAction(t);
    setNewAction("");
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-lg border p-3 transition-colors",
        checkpoint.done
          ? "border-[var(--ink-0)]/30 bg-[var(--bg-2)]/40"
          : "border-[var(--line)] bg-[var(--bg-0)]",
        tag === "FINAL" && "border-[var(--ink-0)]",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDone}
          aria-label={checkpoint.done ? "미완료로" : "완료로"}
          className="shrink-0 text-[var(--ink-2)] hover:text-[var(--ink-0)]"
        >
          {checkpoint.done ? (
            <FiCheckCircle aria-hidden size={18} />
          ) : (
            <FiCircle aria-hidden size={18} />
          )}
        </button>
        {tag && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
              tag === "NOW"
                ? "bg-[#ef4444] text-white"
                : "bg-[var(--ink-0)] text-[var(--bg-0)]",
            )}
          >
            {tag}
          </span>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          placeholder={
            tag === "NOW"
              ? "지금 할 일"
              : tag === "FINAL"
                ? "최종 목표"
                : "중간 목표 이름"
          }
          className={cn(
            "flex-1 bg-transparent text-sm font-medium outline-none",
            checkpoint.done && "line-through opacity-60",
          )}
        />
        <input
          type="date"
          value={toLocalDate(checkpoint.date)}
          onChange={(e) => {
            const ms = new Date(e.target.value).getTime();
            if (!Number.isNaN(ms)) onPatch({ date: ms });
          }}
          className="rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2.5 py-1.5 text-xs"
        />
        <span className="font-mono text-[10px] text-[var(--ink-3)]">
          {dLabel}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label="체크포인트 삭제"
          className="rounded-md p-1.5 text-[var(--ink-3)] hover:bg-[var(--bg-1)]"
        >
          <FiTrash2 aria-hidden />
        </button>
      </div>

      {tag !== "NOW" && (
        <textarea
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          onBlur={commitCriteria}
          rows={1}
          placeholder="달성 조건 (이게 충족되면 done)"
          className="w-full resize-none rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-3 py-2 text-xs outline-none focus:border-[var(--ink-2)]"
        />
      )}

      {tag === "NOW" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-1">
            {(checkpoint.actionItems ?? []).map((a) => (
              <ActionRow
                key={a.id}
                item={a}
                onToggle={() => onToggleAction?.(a.id)}
                onPatch={(p) => onPatchAction?.(a.id, p)}
                onDelete={() => onDeleteAction?.(a.id)}
                onPromote={() => onPromoteAction?.(a.id)}
              />
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitAction();
            }}
            className="flex items-center gap-1.5"
          >
            <FiPlus aria-hidden className="text-[var(--ink-3)]" />
            <input
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              placeholder="지금 할 일 추가 (Enter)"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--ink-3)]"
            />
          </form>
        </div>
      )}
    </div>
  );
}

function ActionRow({
  item,
  onToggle,
  onPatch,
  onDelete,
  onPromote,
}: {
  item: CheckpointActionItem;
  onToggle: () => void;
  onPatch: (p: Partial<CheckpointActionItem>) => void;
  onDelete: () => void;
  onPromote: () => void;
}) {
  const [text, setText] = useState(item.text);
  useEffect(() => setText(item.text), [item.text]);

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2.5 py-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.done ? "미완료로" : "완료로"}
        className="text-[var(--ink-2)] hover:text-[var(--ink-0)]"
      >
        {item.done ? (
          <FiCheckCircle aria-hidden size={14} />
        ) : (
          <FiCircle aria-hidden size={14} />
        )}
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== item.text && onPatch({ text })}
        className={cn(
          "flex-1 bg-transparent text-xs outline-none",
          item.done && "line-through opacity-60",
        )}
      />
      {item.taskId ? (
        <span
          className="font-mono text-[9px] text-[var(--ink-3)]"
          title="태스크로 연결됨"
        >
          ↳ TASK
        </span>
      ) : (
        <button
          type="button"
          onClick={onPromote}
          aria-label="태스크로 보내기"
          title="타임박스 태스크로 보내기"
          className="rounded p-1 text-[var(--ink-3)] hover:text-[var(--ink-0)]"
        >
          <FiSend aria-hidden size={12} />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label="삭제"
        className="rounded p-1 text-[var(--ink-3)] hover:bg-[var(--bg-0)]"
      >
        <FiTrash2 aria-hidden size={12} />
      </button>
    </div>
  );
}
