"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { LabelPicker } from "@/components/shell/LabelPicker";
import { newKeyResult, newKpi } from "@/db/repositories/goals";
import { cn } from "@/lib/cn";
import type { Goal, GoalStatus, KeyResult, Kpi } from "@/types/domain";

interface Props {
  goal: Goal;
  onChange: (patch: Partial<Omit<Goal, "id" | "createdAt">>) => Promise<void>;
  onDelete: () => Promise<void>;
  onStatus: (s: GoalStatus) => Promise<void>;
}

function toLocalDate(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "진행 중",
  achieved: "달성",
  archived: "보류",
};

export function GoalEditor({ goal, onChange, onDelete, onStatus }: Props) {
  const [draft, setDraft] = useState<Goal>(goal);

  useEffect(() => {
    setDraft(goal);
  }, [goal]);

  // Persist with light debounce.
  useEffect(() => {
    const id = setTimeout(() => {
      const {
        title,
        targetDate,
        rationale,
        obstacles,
        plan,
        objective,
        keyResults,
        kpis,
        labelIds,
      } = draft;
      void onChange({
        title,
        targetDate,
        rationale,
        obstacles,
        plan,
        objective,
        keyResults,
        kpis,
        labelIds,
      });
    }, 400);
    return () => clearTimeout(id);
  }, [draft, onChange]);

  const d = differenceInCalendarDays(new Date(draft.targetDate), new Date());
  const dLabel = d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : `D+${-d}`;

  const updateKr = (id: string, patch: Partial<KeyResult>) =>
    setDraft((s) => ({
      ...s,
      keyResults: s.keyResults.map((k) =>
        k.id === id ? { ...k, ...patch } : k,
      ),
    }));
  const addKr = () =>
    setDraft((s) => ({ ...s, keyResults: [...s.keyResults, newKeyResult()] }));
  const removeKr = (id: string) =>
    setDraft((s) => ({
      ...s,
      keyResults: s.keyResults.filter((k) => k.id !== id),
    }));

  const updateKpi = (id: string, patch: Partial<Kpi>) =>
    setDraft((s) => ({
      ...s,
      kpis: s.kpis.map((k) => (k.id === id ? { ...k, ...patch } : k)),
    }));
  const addKpi = () => setDraft((s) => ({ ...s, kpis: [...s.kpis, newKpi()] }));
  const removeKpi = (id: string) =>
    setDraft((s) => ({ ...s, kpis: s.kpis.filter((k) => k.id !== id) }));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
            className="flex-1 bg-transparent text-xl font-semibold outline-none"
            placeholder="목표 제목"
          />
          <span className="font-mono text-sm text-[var(--ink-2)]">
            {dLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-3)]">
          <label className="inline-flex items-center gap-1.5">
            <span>목표일</span>
            <input
              type="date"
              value={toLocalDate(draft.targetDate)}
              onChange={(e) =>
                setDraft((s) => ({
                  ...s,
                  targetDate: new Date(e.target.value).getTime(),
                }))
              }
              className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1"
            />
          </label>
          <span>({format(draft.targetDate, "yyyy.MM.dd")})</span>
          <div className="ml-auto flex items-center gap-1">
            {(["active", "achieved", "archived"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatus(s)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                  draft.status === s
                    ? "border-[var(--ink-0)] bg-[var(--ink-0)] text-[var(--bg-0)]"
                    : "border-[var(--line)] text-[var(--ink-2)]",
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <Section label="라벨">
        <LabelPicker
          selected={draft.labelIds ?? []}
          onChange={(ids) => setDraft((s) => ({ ...s, labelIds: ids }))}
        />
      </Section>

      <Section label="WHY — 동기">
        <textarea
          value={draft.rationale ?? ""}
          onChange={(e) =>
            setDraft((s) => ({ ...s, rationale: e.target.value }))
          }
          rows={2}
          placeholder="이 목표가 왜 중요한가? 누구를 위해, 무엇을 바꾸려고 하는가?"
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
        />
      </Section>

      <Section label="OBSTACLES — 예상 장애물">
        <textarea
          value={draft.obstacles ?? ""}
          onChange={(e) =>
            setDraft((s) => ({ ...s, obstacles: e.target.value }))
          }
          rows={2}
          placeholder="무엇이 가로막을 것인가? 사전 차단 시나리오는?"
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
        />
      </Section>

      <Section label="PLAN — 역산 단계">
        <textarea
          value={draft.plan ?? ""}
          onChange={(e) => setDraft((s) => ({ ...s, plan: e.target.value }))}
          rows={4}
          placeholder="목표 시점에서 거꾸로 시간을 가른다. 3개월 전 / 1개월 전 / 1주 전 / 오늘 무엇을 해야 하는가?"
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
        />
      </Section>

      <Section label="OKR — Objective">
        <input
          value={draft.objective}
          onChange={(e) =>
            setDraft((s) => ({ ...s, objective: e.target.value }))
          }
          placeholder="정성적·열망적 목적 한 문장"
          className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-3 py-2 text-sm outline-none focus:border-[var(--ink-2)]"
        />
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
              Key Results
            </span>
            <button
              type="button"
              onClick={addKr}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-2)] hover:text-[var(--ink-0)]"
            >
              <FiPlus aria-hidden />
              추가
            </button>
          </div>
          {draft.keyResults.length === 0 && (
            <div className="rounded-md border border-dashed border-[var(--line-strong)] py-3 text-center text-xs text-[var(--ink-3)]">
              KR을 2~5개로 정량화하세요.
            </div>
          )}
          {draft.keyResults.map((kr) => (
            <KrRow
              key={kr.id}
              kr={kr}
              onChange={(p) => updateKr(kr.id, p)}
              onRemove={() => removeKr(kr.id)}
            />
          ))}
        </div>
      </Section>

      <Section label="KPI — 측정 지표">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
            매주/매월 추적할 숫자
          </span>
          <button
            type="button"
            onClick={addKpi}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-2)] hover:text-[var(--ink-0)]"
          >
            <FiPlus aria-hidden />
            추가
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {draft.kpis.length === 0 && (
            <div className="rounded-md border border-dashed border-[var(--line-strong)] py-3 text-center text-xs text-[var(--ink-3)]">
              KPI를 1~3개로 추리세요.
            </div>
          )}
          {draft.kpis.map((kpi) => (
            <KpiRow
              key={kpi.id}
              kpi={kpi}
              onChange={(p) => updateKpi(kpi.id, p)}
              onRemove={() => removeKpi(kpi.id)}
            />
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink-0)]"
        >
          <FiTrash2 aria-hidden />
          목표 삭제
        </button>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-3)]">
        {label}
      </h2>
      {children}
    </section>
  );
}

function KrRow({
  kr,
  onChange,
  onRemove,
}: {
  kr: KeyResult;
  onChange: (p: Partial<KeyResult>) => void;
  onRemove: () => void;
}) {
  const progress =
    kr.target && kr.target > 0
      ? Math.min(100, Math.round(((kr.current ?? 0) / kr.target) * 100))
      : 0;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-0)] p-2">
      <div className="flex items-center gap-2">
        <input
          value={kr.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="예: 월간 활성 사용자 1,000명"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="삭제"
          className="rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--bg-1)]"
        >
          <FiTrash2 aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <input
          value={kr.metric ?? ""}
          onChange={(e) => onChange({ metric: e.target.value })}
          placeholder="단위 (예: 명)"
          className="w-24 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1"
        />
        <input
          type="number"
          value={kr.current ?? ""}
          onChange={(e) =>
            onChange({
              current:
                e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
          placeholder="현재"
          className="w-24 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1"
        />
        <span className="text-[var(--ink-3)]">/</span>
        <input
          type="number"
          value={kr.target ?? ""}
          onChange={(e) =>
            onChange({
              target:
                e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
          placeholder="목표"
          className="w-24 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1"
        />
        <span className="ml-auto font-mono text-[var(--ink-2)]">
          {progress}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-2)]">
        <div
          className="h-full bg-[var(--ink-0)] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function KpiRow({
  kpi,
  onChange,
  onRemove,
}: {
  kpi: Kpi;
  onChange: (p: Partial<Kpi>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-0)] p-2">
      <input
        value={kpi.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="KPI 이름"
        className="flex-1 bg-transparent text-sm outline-none"
      />
      <input
        type="number"
        value={kpi.current ?? ""}
        onChange={(e) =>
          onChange({
            current: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        placeholder="현재"
        className="w-20 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1 text-xs"
      />
      <span className="text-xs text-[var(--ink-3)]">/</span>
      <input
        type="number"
        value={kpi.target ?? ""}
        onChange={(e) =>
          onChange({
            target: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        placeholder="목표"
        className="w-20 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1 text-xs"
      />
      <input
        value={kpi.unit ?? ""}
        onChange={(e) => onChange({ unit: e.target.value })}
        placeholder="단위"
        className="w-16 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-2 py-1 text-xs"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="삭제"
        className="rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--bg-1)]"
      >
        <FiTrash2 aria-hidden />
      </button>
    </div>
  );
}
