"use client";

import JSZip from "jszip";
import { getDB } from "@/db/dexie";

const EXPORT_TABLES = [
  "tasks",
  "dumpItems",
  "events",
  "sessions",
  "settings",
  "taskTemplates",
  "goals",
  "labels",
  "periodReflections",
] as const;

type ExportTable = (typeof EXPORT_TABLES)[number];

const DB_VERSION = 7;

interface Manifest {
  version: number;
  exportedAt: number;
  tableCounts: Record<ExportTable, number>;
}

export async function deleteAllData(): Promise<void> {
  const db = getDB();
  await db.transaction(
    "rw",
    EXPORT_TABLES.map((name) => db.table(name)),
    async () => {
      await Promise.all(EXPORT_TABLES.map((name) => db.table(name).clear()));
    },
  );
}

export async function exportAllData(): Promise<Blob> {
  const db = getDB();
  const zip = new JSZip();
  const counts = {} as Record<ExportTable, number>;

  for (const name of EXPORT_TABLES) {
    const rows = await db.table(name).toArray();
    counts[name] = rows.length;
    zip.file(`${name}.json`, JSON.stringify(rows, null, 2));
  }

  const manifest: Manifest = {
    version: DB_VERSION,
    exportedAt: Date.now(),
    tableCounts: counts,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: "blob" });
}

export interface ImportResult {
  counts: Record<ExportTable, number>;
  versionMismatch: boolean;
}

export async function importAllData(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = zip.file("manifest.json");
  let manifest: Manifest | null = null;
  if (manifestEntry) {
    try {
      manifest = JSON.parse(await manifestEntry.async("string")) as Manifest;
    } catch {
      manifest = null;
    }
  }
  const versionMismatch = manifest != null && manifest.version !== DB_VERSION;

  const payload = {} as Record<ExportTable, unknown[]>;
  for (const name of EXPORT_TABLES) {
    const entry = zip.file(`${name}.json`);
    if (!entry) {
      payload[name] = [];
      continue;
    }
    const raw = await entry.async("string");
    const parsed = JSON.parse(raw);
    payload[name] = Array.isArray(parsed) ? parsed : [];
  }

  const db = getDB();
  await db.transaction(
    "rw",
    EXPORT_TABLES.map((name) => db.table(name)),
    async () => {
      for (const name of EXPORT_TABLES) {
        const rows = payload[name];
        if (rows.length === 0) continue;
        await db.table(name).bulkPut(rows);
      }
    },
  );

  const counts = {} as Record<ExportTable, number>;
  for (const name of EXPORT_TABLES) {
    counts[name] = payload[name].length;
  }
  return { counts, versionMismatch };
}
