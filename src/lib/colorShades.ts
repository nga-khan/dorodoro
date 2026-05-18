// Convert hex (#rrggbb or #rgb) → HSL → return an array of shades varying L.
// Used for the animated timer backdrop.

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

export function hslString(h: number, s: number, l: number, alpha = 1) {
  if (alpha >= 1)
    return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
  return `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${alpha})`;
}

/**
 * From a base hex color, derive `count` shades whose lightness wanders
 * within ±range around the source, lightly varying hue and saturation.
 * The pseudo-random offsets are seeded from the hex so the look is
 * consistent for a given color (no jitter on re-render) but feels mixed.
 */
export function shadeMix(
  hex: string,
  count = 5,
  range = 28,
): { color: string; soft: string }[] {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  // Deterministic pseudo-random seed from hex.
  let seed = 0;
  for (let i = 0; i < hex.length; i++)
    seed = (seed * 31 + hex.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const shades: { color: string; soft: string }[] = [];
  for (let i = 0; i < count; i++) {
    const lOffset = (rand() * 2 - 1) * range;
    const hOffset = (rand() * 2 - 1) * 8;
    const sOffset = (rand() * 2 - 1) * 10;
    const lightness = clamp(l + lOffset, 25, 88);
    const saturation = clamp(s + sOffset, 25, 95);
    const hue = (h + hOffset + 360) % 360;
    shades.push({
      color: hslString(hue, saturation, lightness, 0.85),
      soft: hslString(hue, saturation, lightness, 0.35),
    });
  }
  return shades;
}
