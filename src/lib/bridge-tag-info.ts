import type { NoteData, TagBridge } from './types';

export interface BridgeTagSection {
  tag: string;
  notes: Array<{ id: string; title: string }>;
}

/** One group per bridge tag — all notes on this continent that carry the tag. */
export function buildBridgeTagSections(
  bridge: TagBridge,
  continentNotes: NoteData[],
): BridgeTagSection[] {
  return bridge.tags.map((tag) => {
    const notes = continentNotes
      .filter((n) => n.tags.includes(tag))
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((n) => ({ id: n.id, title: n.title }));
    return { tag, notes };
  });
}

export function bridgeKindLabel(kind: TagBridge['kind']): string | null {
  if (kind === 'rainbow') return 'Rainbow bridge';
  if (kind === 'dual') return 'Dual-color bridge';
  return null;
}
