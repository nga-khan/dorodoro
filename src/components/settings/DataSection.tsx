"use client";

import { useRef, useState } from "react";
import { FiDownload, FiTrash2, FiUpload } from "react-icons/fi";
import {
  deleteAllData,
  exportAllData,
  importAllData,
} from "@/db/repositories/maintenance";
import { SettingsSection } from "./SettingsSection";

function formatExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `doro-doro-export-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.zip`;
}

export function DataSection() {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (busy) return;
    setBusy("export");
    try {
      const blob = await exportAllData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = formatExportFilename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("내보내기에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("import");
    try {
      const result = await importAllData(file);
      const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
      const note = result.versionMismatch
        ? "\n(주의: 내보낼 때와 DB 버전이 달라 일부 항목이 불일치할 수 있습니다.)"
        : "";
      alert(`가져오기 완료: ${total}개 항목 병합${note}`);
    } catch (err) {
      console.error(err);
      alert(
        "가져오기에 실패했습니다. 유효한 doro-doro zip 파일인지 확인하세요.",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    await deleteAllData();
    setConfirmingDelete(false);
  };

  return (
    <SettingsSection
      id="data"
      title="데이터"
      description="내보내기 / 업로드 / 전체 삭제."
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-1.5 text-xs hover:bg-[var(--bg-2)] disabled:opacity-50"
        >
          <FiDownload aria-hidden />
          {busy === "export" ? "내보내는 중…" : "데이터 내보내기"}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line-strong)] bg-[var(--bg-1)] px-3 py-1.5 text-xs hover:bg-[var(--bg-2)] disabled:opacity-50"
        >
          <FiUpload aria-hidden />
          {busy === "import" ? "가져오는 중…" : "데이터 업로드"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {!confirmingDelete ? (
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-1.5 text-xs text-[var(--danger-ink)]"
        >
          <FiTrash2 aria-hidden />
          데이터 전체 삭제
        </button>
      ) : (
        <div className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-xs">
          <div className="mb-2 text-[var(--danger-ink)]">
            모든 일정·태스크·세션을 삭제합니다. 되돌릴 수 없습니다.
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md px-2 py-1 text-[var(--ink-2)] hover:bg-[var(--bg-1)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-[var(--danger)] px-2 py-1 text-white hover:opacity-90"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
