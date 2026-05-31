import type { SizeTier } from '../config/building-catalog';

/** Characters below this count use the small building pool. */
export const NOTE_CHAR_SMALL_MAX = 200;

/** Characters below this count use medium; at or above → large. */
export const NOTE_CHAR_MEDIUM_MAX = 3000;

/**
 * Building size tier from note body character count (`entry.body.length`).
 * Thresholds: under 200 small, 200–2999 medium, 3000+ large.
 */
export function sizeTierFromNoteSize(charCount: number): SizeTier {
  if (charCount < NOTE_CHAR_SMALL_MAX) return 'small';
  if (charCount < NOTE_CHAR_MEDIUM_MAX) return 'medium';
  return 'large';
}

/** Sidebar / meta: e.g. "128 字", "1.2k 字". */
export function formatNoteCharCount(charCount: number): string {
  if (charCount >= 10_000) {
    return `${(charCount / 10_000).toFixed(1)}万 字`;
  }
  if (charCount >= 1000) {
    return `${(charCount / 1000).toFixed(1)}k 字`;
  }
  return `${charCount} 字`;
}
