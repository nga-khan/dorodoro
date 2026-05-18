export const TIMER_MIN = 5;
export const TIMER_MAX = 180;
export const TIMER_STEP = 5;

export function clampMinutes(value: number): number {
  if (Number.isNaN(value)) return TIMER_MIN;
  const stepped = Math.round(value / TIMER_STEP) * TIMER_STEP;
  return Math.max(TIMER_MIN, Math.min(TIMER_MAX, stepped));
}

export function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h <= 0)
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Given a remaining time and total, return how many complete hours have elapsed
// and the MM:SS within the current hour.
export function hourBucket(remainingMs: number, totalMs: number) {
  const hourMs = 60 * 60 * 1000;
  const totalHours = Math.ceil(totalMs / hourMs);
  const elapsedMs = totalMs - remainingMs;
  const completedHours = Math.min(totalHours, Math.floor(elapsedMs / hourMs));
  const intoCurrentHour = elapsedMs - completedHours * hourMs;
  const remainingInHour = Math.max(0, hourMs - intoCurrentHour);
  return { totalHours, completedHours, remainingInHour };
}
