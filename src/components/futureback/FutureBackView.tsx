"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { FiPlus, FiTarget } from "react-icons/fi";
import { useGoals } from "@/db/hooks";
import { createGoal, deleteGoal, updateGoal } from "@/db/repositories/goals";
import { cn } from "@/lib/cn";
import type { Goal, GoalStatus } from "@/types/domain";
import { GoalEditor } from "./GoalEditor";
import { STATUS_COLOR, STATUS_LABEL } from "./status";

export function FutureBackView() {
  const goals = useGoals();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = goals.find((g) => g.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId && goals.length > 0) setSelectedId(goals[0].id);
  }, [selectedId, goals]);

  const add = async () => {
    const six = Date.now() + 1000 * 60 * 60 * 24 * 180;
    const g = await createGoal({
      title: "새 목표",
      targetDate: six,
      objective: "",
    });
    setSelectedId(g.id);
  };

  return (
    <section className="grid h-[calc(100vh-200px)] grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-2">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
            목표
          </span>
          <button
            type="button"
            onClick={add}
            aria-label="새 목표"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink-0)] text-[var(--bg-0)] hover:opacity-90"
          >
            <FiPlus aria-hidden />
          </button>
        </div>
        {goals.length === 0 ? (
          <div className="px-2 py-8 text-center text-xs text-[var(--ink-3)]">
            미래 시점을 골라 역산해보세요.
          </div>
        ) : (
          <ul className="flex flex-col">
            {goals.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm",
                    selectedId === g.id
                      ? "bg-[var(--bg-0)]"
                      : "hover:bg-[var(--bg-0)]/60",
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[g.status].dot }}
                      title={STATUS_LABEL[g.status]}
                    />
                    <FiTarget
                      aria-hidden
                      className="shrink-0 text-[var(--ink-3)]"
                    />
                    <span
                      className={cn(
                        "truncate",
                        (g.status === "achieved" ||
                          g.status === "failed" ||
                          g.status === "archived") &&
                          "text-[var(--ink-2)]",
                      )}
                    >
                      {g.title}
                    </span>
                  </span>
                  <DDay ms={g.targetDate} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
        {selected ? (
          <GoalEditor
            key={selected.id}
            goal={selected}
            onChange={(patch) => updateGoal(selected.id, patch)}
            onDelete={async () => {
              await deleteGoal(selected.id);
              setSelectedId(null);
            }}
            onStatus={(status: GoalStatus) =>
              updateGoal(selected.id, { status })
            }
          />
        ) : (
          <div className="grid h-40 place-items-center text-sm text-[var(--ink-3)]">
            왼쪽에서 목표를 선택하거나 새로 만드세요.
          </div>
        )}
      </div>
    </section>
  );
}

function DDay({ ms }: { ms: number }) {
  const d = differenceInCalendarDays(new Date(ms), new Date());
  const label = d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : `D+${-d}`;
  const tone =
    d < 0
      ? "text-[var(--ink-3)]"
      : d <= 14
        ? "text-[#ef4444]"
        : "text-[var(--ink-2)]";
  return (
    <span
      className={cn("font-mono text-[10px]", tone)}
      title={format(ms, "yyyy.MM.dd")}
    >
      {label}
    </span>
  );
}

export type { Goal };
