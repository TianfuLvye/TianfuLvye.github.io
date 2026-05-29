import { hashString, rngFor } from './random';

/** Stable natural wood tone per tag name. */
export function colorForTag(tag: string): string {
  const palette = [
    '#8b6914',
    '#a0714f',
    '#b8886b',
    '#9c7a4a',
    '#7a5c3e',
    '#c49a6c',
    '#6b4423',
    '#a67b5b',
    '#8d6e4c',
    '#9a6b3f',
  ];
  const idx = hashString(tag) % palette.length;
  const rng = rngFor(`tag-tint:${tag}`);
  const tint = 0.94 + rng() * 0.08;
  const base = palette[idx];
  return tintWoodHex(base, tint);
}

function tintWoodHex(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((n & 255) * factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
