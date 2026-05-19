"use client";

import { hourBucket } from "@/lib/time";

interface Props {
  color: string;
  totalMs: number;
  remainingMs: number;
}

export function HourGauge({ color, totalMs, remainingMs }: Props) {
  const { totalHours, completedHours, remainingInHour } = hourBucket(
    remainingMs,
    totalMs,
  );
  if (totalHours < 1 || totalMs < 60 * 60 * 1000) return null;
  const hourMs = 60 * 60 * 1000;
  const currentHourProgress = 1 - remainingInHour / hourMs;

  return (
    <div className="flex w-[160px] gap-1">
      {Array.from({ length: totalHours }, (_, i) => `hour-${i}`).map(
        (id, i) => {
          const filled = i < completedHours;
          const isCurrent = i === completedHours;
          const fillRatio = filled ? 1 : isCurrent ? currentHourProgress : 0;
          return (
            <div
              key={id}
              className="relative h-3 flex-1 overflow-hidden rounded-full border border-[var(--line-strong)] bg-[var(--bg-1)]"
              title={`hour ${i + 1} of ${totalHours}`}
            >
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-300"
                style={{
                  width: `${Math.round(fillRatio * 100)}%`,
                  background: color,
                }}
              />
            </div>
          );
        },
      )}
    </div>
  );
}
