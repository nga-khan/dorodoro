"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FiBookOpen,
  FiDownload,
  FiList,
  FiSettings,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import {
  deleteAllData,
  exportAllData,
  importAllData,
} from "@/db/repositories/maintenance";
import { ThemeToggle } from "./ThemeToggle";

function formatExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `doro-doro-export-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.zip`;
}

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleDelete = async () => {
    await deleteAllData();
    setConfirmingDelete(false);
    setOpen(false);
  };

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
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("내보내기에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const triggerImport = () => {
    if (busy) return;
    fileInputRef.current?.click();
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
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert(
        "가져오기에 실패했습니다. 유효한 doro-doro zip 파일인지 확인하세요.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="설정"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-1)] hover:bg-[var(--bg-1)]"
      >
        <FiSettings aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-60 rounded-xl border border-[var(--line)] bg-[var(--bg-0)] p-1 shadow-[var(--shadow-card)] z-40"
          >
            <ThemeToggle variant="menu" onAfter={() => setOpen(false)} />
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--bg-1)]"
            >
              <FiSettings aria-hidden />
              설정
            </Link>
            <Link
              href="/templates"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--bg-1)]"
            >
              <FiList aria-hidden />할 일 템플릿
            </Link>
            <Link
              href="/histories"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--bg-1)]"
            >
              <FiBookOpen aria-hidden />
              회고
            </Link>
            <div className="my-1 h-px bg-[var(--line)]" />
            <button
              type="button"
              onClick={handleExport}
              disabled={busy !== null}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--bg-1)] disabled:opacity-50"
            >
              <FiDownload aria-hidden />
              {busy === "export" ? "내보내는 중…" : "데이터 내보내기"}
            </button>
            <button
              type="button"
              onClick={triggerImport}
              disabled={busy !== null}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[var(--bg-1)] disabled:opacity-50"
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
            <div className="my-1 h-px bg-[var(--line)]" />
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-[var(--danger-ink)] hover:bg-[var(--danger-bg)]"
              >
                <FiTrash2 aria-hidden />
                데이터 삭제
              </button>
            ) : (
              <div className="rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2 py-2 text-xs">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
