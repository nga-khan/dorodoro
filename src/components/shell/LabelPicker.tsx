"use client";

import { useState } from "react";
import { FiPlus, FiTag, FiX } from "react-icons/fi";
import { useLabels } from "@/db/hooks";
import { createLabel, nextLabelColor } from "@/db/repositories/labels";

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
}

export function LabelPicker({ selected, onChange }: Props) {
  const labels = useLabels();
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>("#3b82f6");

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  };

  const addLabel = async () => {
    const name = draftName.trim();
    if (!name) return;
    const l = await createLabel({ name, color: draftColor });
    onChange([...selected, l.id]);
    setDraftName("");
    setDraftColor(nextLabelColor([...labels, l]));
  };

  const selectedSet = new Set(selected);
  const selectedLabels = labels.filter((l) => selectedSet.has(l.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedLabels.map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
            style={{
              color: l.color,
              background: `color-mix(in oklab, ${l.color} 18%, transparent)`,
            }}
          >
            <FiTag aria-hidden className="text-[10px]" />
            {l.name}
            <button
              type="button"
              onClick={() => toggle(l.id)}
              aria-label={`${l.name} 라벨 제거`}
              className="-mr-1 rounded-full p-0.5 hover:bg-[var(--bg-1)]"
            >
              <FiX aria-hidden className="text-[10px]" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (!draftColor && labels.length === 0)
              setDraftColor(nextLabelColor([]));
          }}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--line-strong)] px-2 py-0.5 text-[11px] text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
        >
          <FiPlus aria-hidden className="text-[10px]" />
          라벨
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-1)] p-2">
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const active = selectedSet.has(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggle(l.id)}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                    style={{
                      borderColor: active ? l.color : "var(--line-strong)",
                      color: active ? l.color : "var(--ink-2)",
                      background: active
                        ? `color-mix(in oklab, ${l.color} 18%, transparent)`
                        : "transparent",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: l.color }}
                    />
                    {l.name}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              aria-label="라벨 색상"
              className="h-7 w-7 cursor-pointer rounded-md border border-[var(--line-strong)] bg-transparent"
            />
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addLabel();
                }
              }}
              placeholder="새 라벨 이름"
              className="flex-1 rounded-md border border-[var(--line-strong)] bg-[var(--bg-0)] px-2 py-1 text-xs outline-none focus:border-[var(--ink-2)]"
            />
            <button
              type="button"
              onClick={() => void addLabel()}
              className="rounded-md bg-[var(--ink-0)] px-2 py-1 text-xs text-[var(--bg-0)] hover:opacity-90"
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
