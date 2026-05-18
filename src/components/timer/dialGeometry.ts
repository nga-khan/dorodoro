// 12-wedge dial geometry. 0deg = 12 o'clock, clockwise.
export const WEDGE_COUNT = 12;

// Quantize to 3 decimals so server/client serialize identical SVG path strings.
// Without this, tiny float-precision differences between platforms cause
// React hydration mismatches in the dial path `d` attribute.
function q(n: number): string {
  return (Math.round(n * 1000) / 1000).toFixed(3);
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${q(start.x)} ${q(start.y)} A ${q(r)} ${q(r)} 0 ${largeArc} 1 ${q(end.x)} ${q(end.y)}`;
}

export interface WedgeMeta {
  index: number;
  startDeg: number;
  endDeg: number;
  /** This wedge currently holds time (alpha > 0). */
  active: boolean;
  /** This wedge is the one currently draining (slow pulse). */
  draining: boolean;
}

/**
 * Given remaining time in the current hour and the wedge size (ms),
 * return wedge metadata for 12 wedges. Earlier wedges (lower index)
 * represent earlier-elapsed time; they drain first as time flows.
 *
 * Layout: wedge 0 = 12→1 o'clock (0°–30°), wedge 1 = 1→2 o'clock, ...
 * As time passes, wedges drain in clockwise order (wedge 0 first).
 */
export function computeWedges(
  remainingInHourMs: number,
  wedgeMs: number,
  gapDeg = 2,
): WedgeMeta[] {
  const result: WedgeMeta[] = [];
  // Number of wedges still holding any time. ceil = the partially-full wedge counts as active.
  const activeCount = Math.min(
    WEDGE_COUNT,
    Math.max(0, Math.ceil(remainingInHourMs / wedgeMs)),
  );
  // The currently-draining wedge is the one that is partially full.
  // It is the last active wedge (highest index among active) when counting from the tail.
  // Convention: drain from wedge 0 first (clockwise from 12). So the draining wedge
  // is the one at index (WEDGE_COUNT - activeCount) — the earliest still-active wedge.
  const drainingIdx =
    activeCount > 0 && remainingInHourMs % wedgeMs !== 0
      ? WEDGE_COUNT - activeCount
      : -1;

  const wedgeArc = 360 / WEDGE_COUNT;
  for (let i = 0; i < WEDGE_COUNT; i++) {
    const startDeg = i * wedgeArc + gapDeg / 2;
    const endDeg = (i + 1) * wedgeArc - gapDeg / 2;
    const active = i >= WEDGE_COUNT - activeCount;
    result.push({
      index: i,
      startDeg,
      endDeg,
      active,
      draining: i === drainingIdx,
    });
  }
  return result;
}
