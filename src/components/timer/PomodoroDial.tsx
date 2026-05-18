"use client";

import { motion } from "motion/react";
import { formatMMSS, hourBucket } from "@/lib/time";
import { arcPath, computeWedges } from "./dialGeometry";

interface Props {
  size?: number;
  color: string;
  totalMs: number;
  remainingMs: number;
  isRunning?: boolean;
}

export function PomodoroDial({
  size = 320,
  color,
  totalMs,
  remainingMs,
  isRunning = false,
}: Props) {
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Always 12 wedges → 1 wedge = 1/12 of the current hour bucket
  // (= 5 min for a 60-min hour; scales for shorter timers).
  const hourMs = 60 * 60 * 1000;
  const overHour = totalMs >= hourMs;
  const { remainingInHour } = hourBucket(remainingMs, totalMs);
  // For timers under an hour, the "hour" is the whole timer length.
  const bucketMs = overHour ? hourMs : totalMs;
  const remainingInBucket = overHour ? remainingInHour : remainingMs;
  const wedgeMs = bucketMs / 12;
  const wedges = computeWedges(remainingInBucket, wedgeMs, 6);

  const mmss = overHour ? formatMMSS(remainingInHour) : formatMMSS(remainingMs);
  const [mm, ss] = mmss.split(":");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="select-none"
      role="img"
      aria-label="pomodoro timer"
    >
      <title>Pomodoro Timer</title>
      {wedges.map((w) => {
        const d = arcPath(cx, cy, radius, w.startDeg, w.endDeg);
        if (!w.active) {
          return (
            <path
              key={w.index}
              d={d}
              fill="none"
              stroke="var(--bg-2)"
              strokeWidth={stroke}
              strokeLinecap="butt"
            />
          );
        }
        if (w.draining) {
          return (
            <motion.path
              key={w.index}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              animate={isRunning ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
              transition={
                isRunning
                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
            />
          );
        }
        return (
          <path
            key={w.index}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        );
      })}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-[var(--ink-0)] font-mono"
        style={{ fontSize: size * 0.18, fontVariantNumeric: "tabular-nums" }}
      >
        <tspan>{mm}</tspan>
        <tspan className={isRunning ? "animate-colon-blink" : undefined}>
          :
        </tspan>
        <tspan>{ss}</tspan>
      </text>
    </svg>
  );
}
