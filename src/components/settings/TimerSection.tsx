"use client";

import { useSettings } from "@/db/hooks";
import { updateSettings } from "@/db/repositories/settings";
import { cn } from "@/lib/cn";
import { SettingsRow, SettingsSection, Toggle } from "./SettingsSection";

const COLOR_PRESETS = [
  "#111111",
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#ef4444",
  "#a855f7",
];

export function TimerSection() {
  const settings = useSettings();
  const cycle = settings.cycle;

  return (
    <SettingsSection
      id="timer"
      title="타이머"
      description="포모도로 색상과 자동 사이클 옵션."
    >
      <SettingsRow label="색상" hint="다이얼 강조 색">
        <div className="flex items-center gap-1.5">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`color ${c}`}
              onClick={() => updateSettings({ timerColor: c })}
              className={cn(
                "h-6 w-6 rounded-full border transition-transform",
                settings.timerColor === c
                  ? "border-[var(--ink-0)] scale-110"
                  : "border-[var(--line-strong)] hover:scale-105",
              )}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={settings.timerColor}
            onChange={(e) => updateSettings({ timerColor: e.target.value })}
            className="h-6 w-6 cursor-pointer rounded-full border border-[var(--line-strong)] bg-transparent"
            aria-label="custom color"
          />
        </div>
      </SettingsRow>

      <SettingsRow label="자동 사이클 모드" hint="작업↔휴식 자동 전환">
        <Toggle
          on={settings.cycleEnabled}
          onChange={(v) => updateSettings({ cycleEnabled: v })}
          ariaLabel="자동 사이클"
        />
      </SettingsRow>

      {settings.cycleEnabled && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <NumField
            label="짧은 휴식 (분)"
            value={cycle.shortMin}
            onChange={(v) =>
              updateSettings({ cycle: { ...cycle, shortMin: v } })
            }
          />
          <NumField
            label="긴 휴식 (분)"
            value={cycle.longMin}
            onChange={(v) =>
              updateSettings({ cycle: { ...cycle, longMin: v } })
            }
          />
          <NumField
            label="긴휴식 전 세트"
            value={cycle.setsBeforeLong}
            onChange={(v) =>
              updateSettings({
                cycle: { ...cycle, setsBeforeLong: Math.max(1, v) },
              })
            }
          />
        </div>
      )}
    </SettingsSection>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
        {label}
      </span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-2 py-1.5 text-sm outline-none focus:border-[var(--ink-2)]"
      />
    </label>
  );
}
