"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/db/hooks";
import { updateSettings } from "@/db/repositories/settings";
import {
  ensurePermission,
  getNotificationPermission,
  notifyPhaseEnd,
  supportsNotifications,
} from "@/lib/notify";
import { SettingsRow, SettingsSection, Toggle } from "./SettingsSection";

export function NotificationsSection() {
  const settings = useSettings();
  const n = settings.notifications;
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const supported = supportsNotifications();

  const setEnabled = async (next: boolean) => {
    if (next && supported) {
      const perm = await ensurePermission();
      setPermission(perm);
      if (perm !== "granted") {
        if (typeof window !== "undefined") {
          window.alert(
            "브라우저에서 알림 권한이 거부되어 있습니다. 사이트 권한 설정에서 알림을 허용하세요.",
          );
        }
        return;
      }
    }
    await updateSettings({ notifications: { ...n, enabled: next } });
  };

  const setSound = (next: boolean) =>
    updateSettings({ notifications: { ...n, sound: next } });

  const setPhase = (phase: keyof typeof n.perPhase, next: boolean) =>
    updateSettings({
      notifications: { ...n, perPhase: { ...n.perPhase, [phase]: next } },
    });

  const testNotify = () => {
    notifyPhaseEnd({ phase: "work", enabled: true, sound: n.sound });
  };

  return (
    <SettingsSection
      id="notifications"
      title="알림"
      description="타이머 세션이 끝났을 때 브라우저 알림과 사운드로 알려드립니다."
    >
      {!supported && (
        <div className="rounded-md border border-[var(--line)] bg-[var(--bg-1)] px-3 py-2 text-xs text-[var(--ink-3)]">
          이 브라우저는 Notification API를 지원하지 않습니다.
        </div>
      )}
      {supported && permission === "denied" && (
        <div className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger-ink)]">
          알림 권한이 거부되어 있습니다. 브라우저 사이트 설정에서 허용으로
          바꾸세요.
        </div>
      )}

      <SettingsRow label="알림 켜기" hint="전체 알림 ON/OFF">
        <Toggle on={n.enabled} onChange={setEnabled} ariaLabel="알림 켜기" />
      </SettingsRow>
      <SettingsRow label="사운드" hint="짧은 비프음 재생">
        <Toggle on={n.sound} onChange={setSound} ariaLabel="사운드" />
      </SettingsRow>

      <div className="my-2 h-px bg-[var(--line)]" />
      <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
        세션별
      </div>
      <SettingsRow label="작업 세션 종료">
        <Toggle
          on={n.perPhase.work}
          onChange={(v) => setPhase("work", v)}
          ariaLabel="작업 알림"
        />
      </SettingsRow>
      <SettingsRow label="짧은 휴식 종료">
        <Toggle
          on={n.perPhase.shortBreak}
          onChange={(v) => setPhase("shortBreak", v)}
          ariaLabel="짧은 휴식 알림"
        />
      </SettingsRow>
      <SettingsRow label="긴 휴식 종료">
        <Toggle
          on={n.perPhase.longBreak}
          onChange={(v) => setPhase("longBreak", v)}
          ariaLabel="긴 휴식 알림"
        />
      </SettingsRow>

      <button
        type="button"
        onClick={testNotify}
        className="mt-2 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-1.5 text-xs hover:bg-[var(--bg-2)]"
      >
        테스트 알림
      </button>
    </SettingsSection>
  );
}
