"use client";

import { shadeMix } from "@/lib/colorShades";

interface Props {
  color: string;
  size: number;
  active?: boolean;
}

export function TimerBackdrop({ color, size, active = true }: Props) {
  const shades = shadeMix(color, 5, 26);
  const stops = shades
    .map((s, i) => `${s.color} ${(i / (shades.length - 1)) * 100}%`)
    .join(", ");
  const bg = `linear-gradient(135deg, ${stops})`;
  // Sun-like radial flare: brighter core fading to transparent.
  const flare = `radial-gradient(circle at 50% 50%, ${shades[0].color} 0%, ${shades[2].soft} 38%, transparent 72%)`;
  const halo = size * 1.35;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        width: halo,
        height: halo,
        left: `calc(50% - ${halo / 2}px)`,
        top: `calc(50% - ${halo / 2}px)`,
        opacity: active ? 0.14 : 0.12,
      }}
      aria-hidden
    >
      <div
        className="timer-backdrop absolute inset-0 rounded-full"
        style={{
          backgroundImage: bg,
          animationPlayState: active ? "running" : "paused",
        }}
      />
      <div
        className="timer-backdrop-shimmer absolute inset-0 rounded-full"
        style={{
          backgroundImage: flare,
          animationPlayState: active ? "running" : "paused",
          filter: "blur(18px)",
        }}
      />
    </div>
  );
}
