"use client";

interface SparkProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
  className?: string;
}

export function Sparkline({
  values,
  width = 120,
  height = 32,
  color = "var(--ink-0)",
  fill = "var(--bg-2)",
  className,
}: SparkProps) {
  if (values.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        aria-hidden
      >
        <title>sparkline</title>
      </svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPath = `M0,${height} L${points.split(" ").join(" L")} L${width},${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <title>sparkline</title>
      <path d={areaPath} fill={fill} opacity={0.6} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface BarsProps {
  values: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function MiniBars({
  values,
  labels,
  height = 36,
  color = "var(--ink-0)",
  className,
}: BarsProps) {
  const max = Math.max(...values, 1);
  return (
    <div className={className}>
      <div className="flex items-end gap-1" style={{ height }}>
        {values.map((v, i) => {
          const h = Math.max(2, Math.round((v / max) * (height - 6)));
          return (
            <div
              key={`bar-${i}-${v}`}
              className="flex flex-1 flex-col items-center justify-end gap-1"
            >
              <div
                className="w-full rounded-sm"
                style={{ height: `${h}px`, background: color }}
                title={String(v)}
              />
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="mt-1 flex gap-1 text-[9px] text-[var(--ink-3)]">
          {labels.map((l, i) => (
            <span key={`lbl-${i}-${l}`} className="flex-1 text-center">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface RingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
}

export function ProgressRing({
  value,
  max,
  size = 36,
  stroke = 4,
  color = "var(--ink-0)",
  track = "var(--bg-2)",
  label,
}: RingProps) {
  const safeMax = max <= 0 ? 1 : max;
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <title>{label ?? "progress"}</title>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={track}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
