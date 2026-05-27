import type { CollectionEntry } from 'astro:content';
import path from 'node:path';

/** Human-readable title from note id (e.g. `test/picture-test` → `Picture test`). */
export function titleFromNoteId(id: string): string {
  const base = path.basename(id);
  const spaced = base.replace(/[-_]+/g, ' ');
  if (!spaced) return 'Untitled';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function resolveNoteTitle(entry: CollectionEntry<'notes'>): string {
  const fromFm = entry.data.title?.trim();
  return fromFm || titleFromNoteId(entry.id);
}

/** Stable fallback when frontmatter omits `date` (Test4-style notes). */
export function resolveNoteDate(entry: CollectionEntry<'notes'>): Date {
  const d = entry.data.date;
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
  return new Date('2026-01-01T00:00:00.000Z');
}
