"use client";

import type { ReactNode } from "react";

export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-[var(--line)] bg-[var(--bg-0)] p-5"
    >
      <header className="mb-4">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-[var(--ink-3)]">{description}</p>
        )}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {hint && (
          <div className="mt-0.5 text-[11px] text-[var(--ink-3)]">{hint}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className="relative h-6 w-11 rounded-full border transition-colors"
      style={{
        background: on ? "var(--ink-0)" : "var(--bg-2)",
        borderColor: on ? "var(--ink-0)" : "var(--line-strong)",
      }}
    >
      <span
        className="block h-5 w-5 rounded-full bg-[var(--bg-0)] transition-transform"
        style={{ transform: on ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}
