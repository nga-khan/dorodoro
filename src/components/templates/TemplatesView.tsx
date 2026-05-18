"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiCheck, FiPlay, FiPlus, FiTrash2 } from "react-icons/fi";
import { useTaskTemplates } from "@/db/hooks";
import {
  applyTemplate,
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from "@/db/repositories/taskTemplates";
import { cn } from "@/lib/cn";
import type { Priority, TaskTemplate, TaskTemplateItem } from "@/types/domain";

export function TemplatesView() {
  const templates = useTaskTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = templates.find((t) => t.id === selectedId) ?? null;

  // Auto-select first template once data arrives.
  useEffect(() => {
    if (!selectedId && templates.length > 0) setSelectedId(templates[0].id);
  }, [selectedId, templates]);

  const addTemplate = async () => {
    const tpl = await createTemplate({ name: "새 템플릿", items: [] });
    setSelectedId(tpl.id);
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink-0)]"
        >
          <FiArrowLeft aria-hidden /> 돌아가기
        </Link>
        <h1 className="font-mono text-lg">할 일 템플릿</h1>
        <button
          type="button"
          onClick={addTemplate}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--ink-0)] px-3 py-1.5 text-xs text-[var(--bg-0)] hover:opacity-90"
        >
          <FiPlus aria-hidden />새 템플릿
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-2">
          {templates.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-[var(--ink-3)]">
              템플릿이 없습니다.
            </div>
          ) : (
            <ul className="flex flex-col">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm",
                      selectedId === t.id
                        ? "bg-[var(--bg-0)]"
                        : "hover:bg-[var(--bg-0)]/60",
                    )}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-[10px] text-[var(--ink-3)]">
                      {t.items.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] p-4">
          {selected ? (
            <TemplateEditor key={selected.id} template={selected} />
          ) : (
            <div className="grid h-40 place-items-center text-sm text-[var(--ink-3)]">
              왼쪽에서 템플릿을 선택하세요.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TemplateEditor({ template }: { template: TaskTemplate }) {
  const [name, setName] = useState(template.name);
  const [items, setItems] = useState<TaskTemplateItem[]>(template.items);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = async () => {
    await updateTemplate(template.id, { name, items });
    setSavedAt(Date.now());
  };

  const addItem = () => {
    setItems((prev) => [...prev, { title: "", priority: 3, estimateMin: 25 }]);
  };

  const updateItem = (i: number, patch: Partial<TaskTemplateItem>) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    );
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const remove = async () => {
    await deleteTemplate(template.id);
  };

  const apply = async () => {
    await save();
    await applyTemplate(template.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="템플릿 이름"
          className="flex-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2 text-base outline-none focus:border-[var(--ink-2)]"
        />
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-1 rounded-md bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--bg-0)] hover:opacity-90"
        >
          <FiCheck aria-hidden />
          저장
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <div className="rounded-md border border-dashed border-[var(--line-strong)] px-3 py-6 text-center text-xs text-[var(--ink-3)]">
            항목이 없습니다.
          </div>
        )}
        {items.map((item, i) => (
          <div
            key={`${template.id}-${i}`}
            className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--bg-0)] px-2 py-1.5"
          >
            <input
              value={item.title}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              placeholder="할 일 제목"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <select
              value={item.priority}
              onChange={(e) =>
                updateItem(i, {
                  priority: Number(e.target.value) as Priority,
                })
              }
              className="rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-1 py-1 text-xs"
              aria-label="우선순위"
            >
              <option value={1}>P1</option>
              <option value={2}>P2</option>
              <option value={3}>P3</option>
              <option value={4}>P4</option>
            </select>
            <input
              type="number"
              min={5}
              max={240}
              value={item.estimateMin ?? 25}
              onChange={(e) =>
                updateItem(i, { estimateMin: Number(e.target.value) || 25 })
              }
              className="w-16 rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-1 py-1 text-xs"
              aria-label="예상 분"
            />
            <span className="text-[10px] text-[var(--ink-3)]">분</span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              aria-label="삭제"
              className="rounded-md p-1 text-[var(--danger-ink)] hover:bg-[var(--danger-bg)]"
            >
              <FiTrash2 aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-dashed border-[var(--line-strong)] py-2 text-xs text-[var(--ink-2)] hover:bg-[var(--bg-0)]"
        >
          <FiPlus aria-hidden /> 항목 추가
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={remove}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2.5 py-1.5 text-xs text-[var(--danger-ink)] hover:bg-[color-mix(in_oklab,var(--danger-bg)_70%,var(--danger)_30%)]"
        >
          <FiTrash2 aria-hidden />
          템플릿 삭제
        </button>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="text-[10px] text-[var(--ink-3)]">저장됨</span>
          )}
          <button
            type="button"
            onClick={apply}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-3 py-2 text-sm hover:bg-[var(--bg-1)]"
          >
            <FiPlay aria-hidden />할 일에 적용
          </button>
        </div>
      </div>
    </div>
  );
}
