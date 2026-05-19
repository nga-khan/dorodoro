import type { CalendarItem, Label } from "@/types/domain";

export type LabelLookup = Map<string, Label>;

export function buildLabelLookup(labels: Label[]): LabelLookup {
  const map = new Map<string, Label>();
  for (const l of labels) map.set(l.id, l);
  return map;
}

/** Label color wins over the item's own color. Returns null when neither is set. */
export function resolveEventColor(
  item: CalendarItem,
  labels: LabelLookup,
): string | null {
  const ids = item.data.labelIds;
  if (ids && ids.length > 0) {
    for (const id of ids) {
      const l = labels.get(id);
      if (l?.color) return l.color;
    }
  }
  return item.data.color ?? null;
}

/** Returns inline style for an event block: tinted background only (no left stripe). */
export function eventBlockStyle(color: string | null): React.CSSProperties {
  if (!color) {
    return { background: "var(--bg-2)" };
  }
  return {
    background: `color-mix(in srgb, ${color} 26%, var(--bg-0))`,
  };
}
