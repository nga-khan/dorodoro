"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import {
  addActionItem,
  addCheckpoint,
  type BackcastMode,
  deleteActionItem,
  deleteCheckpoint,
  generateCheckpoints,
  promoteActionToTask,
  toggleActionItemDone,
  toggleCheckpointDone,
  updateActionItem,
  updateCheckpoint,
} from "@/db/repositories/goals";
import { cn } from "@/lib/cn";
import type { Goal } from "@/types/domain";
import { CheckpointCard } from "./CheckpointCard";

const MODE_LABEL: Record<BackcastMode, string> = {
  preset: "프리셋 (1주/1개월/3개월/6개월)",
  even: "균등 5등분",
  halving: "절반씩 (후반 집중)",
};

export function BackcastTimeline({ goal }: { goal: Goal }) {
  const [mode, setMode] = useState<BackcastMode>("preset");
  const checkpoints = [...(goal.checkpoints ?? [])].sort(
    (a, b) => a.date - b.date,
  );
  const total = checkpoints.length;
  const doneCount = checkpoints.filter((c) => c.done).length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const onGenerate = async () => {
    if (
      checkpoints.length > 0 &&
      !confirm("기존 체크포인트를 덮어쓰고 자동 분할합니다. 진행할까요?")
    )
      return;
    await generateCheckpoints(goal.id, mode);
  };

  const onAddManual = async () => {
    const todayMs = Date.now();
    const mid = Math.round((todayMs + goal.targetDate) / 2);
    await addCheckpoint(goal.id, { date: mid, title: "" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as BackcastMode)}
          className="rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-3 py-1.5 text-xs"
        >
          {(Object.keys(MODE_LABEL) as BackcastMode[]).map((m) => (
            <option key={m} value={m}>
              {MODE_LABEL[m]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-md border border-[var(--ink-0)] bg-[var(--ink-0)] px-3.5 py-1.5 text-xs text-[var(--bg-0)] hover:opacity-90"
        >
          자동 분할
        </button>
        <button
          type="button"
          onClick={onAddManual}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-0)]"
        >
          <FiPlus aria-hidden />
          체크포인트 추가
        </button>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-[var(--ink-3)]">
          <span className="font-mono">
            {doneCount}/{total}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-2)]">
            <div
              className="h-full bg-[var(--ink-0)] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono">{progress}%</span>
        </div>
      </div>

      {checkpoints.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--line-strong)] py-6 text-center text-xs text-[var(--ink-3)]">
          최종 목표일에서 거꾸로 체크포인트를 나누세요.
          <br />
          모든 체크포인트가 완료되면 목표가 자동 달성됩니다.
        </div>
      ) : (
        <ol className="relative flex flex-col gap-2 pl-3">
          <span
            aria-hidden
            className={cn(
              "absolute left-[5px] top-2 bottom-2 w-px",
              "bg-[var(--line-strong)]",
            )}
          />
          {checkpoints.map((cp, i) => (
            <li key={cp.id} className="relative">
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[7px] top-3.5 h-2.5 w-2.5 rounded-full border",
                  cp.done
                    ? "border-[var(--ink-0)] bg-[var(--ink-0)]"
                    : "border-[var(--line-strong)] bg-[var(--bg-1)]",
                )}
              />
              <CheckpointCard
                checkpoint={cp}
                isFirst={i === 0}
                isLast={i === checkpoints.length - 1}
                onPatch={(p) => updateCheckpoint(goal.id, cp.id, p)}
                onToggleDone={() => toggleCheckpointDone(goal.id, cp.id)}
                onDelete={() => deleteCheckpoint(goal.id, cp.id)}
                onAddAction={(text) => addActionItem(goal.id, cp.id, text)}
                onPatchAction={(itemId, p) =>
                  updateActionItem(goal.id, cp.id, itemId, p)
                }
                onDeleteAction={(itemId) =>
                  deleteActionItem(goal.id, cp.id, itemId)
                }
                onToggleAction={(itemId) =>
                  toggleActionItemDone(goal.id, cp.id, itemId)
                }
                onPromoteAction={(itemId) =>
                  promoteActionToTask(goal.id, cp.id, itemId)
                }
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
