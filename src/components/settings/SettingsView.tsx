"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { DataSection } from "./DataSection";
import { NotificationsSection } from "./NotificationsSection";
import { SettingsRow, SettingsSection } from "./SettingsSection";
import { TimerSection } from "./TimerSection";

const NAV = [
  { id: "timer", label: "타이머" },
  { id: "notifications", label: "알림" },
  { id: "theme", label: "테마" },
  { id: "data", label: "데이터" },
];

export function SettingsView() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] hover:text-[var(--ink-0)]"
        >
          <FiArrowLeft aria-hidden /> 돌아가기
        </Link>
        <h1 className="font-mono text-lg">설정</h1>
        <div className="w-12" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
        <nav className="hidden lg:block">
          <ul className="sticky top-4 space-y-1 text-sm">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className="block rounded-md px-2 py-1.5 text-[var(--ink-2)] hover:bg-[var(--bg-1)] hover:text-[var(--ink-0)]"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-4">
          <TimerSection />
          <NotificationsSection />
          <SettingsSection
            id="theme"
            title="테마"
            description="라이트 · 다크 · 시스템."
          >
            <SettingsRow label="모드">
              <ThemeToggle />
            </SettingsRow>
          </SettingsSection>
          <DataSection />
        </div>
      </div>
    </section>
  );
}
