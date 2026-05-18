"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

interface Props {
  /** Rendered height in px; width scales by the source aspect ratio (~1019:640). */
  height?: number;
  className?: string;
  priority?: boolean;
}

const ASPECT = 1019 / 640;

export function Logo({ height = 24, className, priority }: Props) {
  const width = Math.round(height * ASPECT);
  return (
    <span
      className={cn("inline-flex items-center", className)}
      role="img"
      aria-label="doro-doro"
    >
      <span className="logo-on-light">
        <Image
          src="/logo-light.svg"
          alt="doro-doro"
          width={width}
          height={height}
          priority={priority}
        />
      </span>
      <span className="logo-on-dark">
        <Image
          src="/logo-dark.svg"
          alt="doro-doro"
          width={width}
          height={height}
          priority={priority}
        />
      </span>
    </span>
  );
}
