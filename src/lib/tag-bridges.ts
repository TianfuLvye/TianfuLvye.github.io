import { rngFor } from './random';
import type { NoteData, TagBridge, TagBridgeKind } from './types';

class UnionFind {
  private parent = new Map<string, string>();

  find(id: string): string {
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    let node = id;
    while (node !== root) {
      const next = this.parent.get(node)!;
      this.parent.set(node, root);
      node = next;
    }
    return root;
  }

  union(a: string, b: string): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent.set(ra, rb);
    return true;
  }

  ensure(id: string): void {
    if (!this.parent.has(id)) this.parent.set(id, id);
  }
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
}

function sharedTags(a: NoteData, b: NoteData): string[] {
  const setB = new Set(b.tags);
  return a.tags.filter((t) => setB.has(t)).sort();
}

function bridgeKind(tagCount: number): TagBridgeKind {
  if (tagCount >= 3) return 'rainbow';
  if (tagCount === 2) return 'dual';
  return 'single';
}

function bridgePriority(kind: TagBridgeKind): 1 | 2 | 3 {
  if (kind === 'rainbow') return 3;
  if (kind === 'dual') return 2;
  return 1;
}

/**
 * Per-continent spanning forests: each tag with k notes gets k−1 physical bridges.
 * Pairs with more shared tags are preferred (rainbow > dual > single).
 */
export function buildTagBridges(notes: NoteData[]): TagBridge[] {
  if (notes.length < 2) return [];

  const tagUfs = new Map<string, UnionFind>();
  for (const note of notes) {
    for (const tag of note.tags) {
      if (!tagUfs.has(tag)) tagUfs.set(tag, new UnionFind());
      tagUfs.get(tag)!.ensure(note.id);
    }
  }

  type Candidate = { a: NoteData; b: NoteData; tags: string[] };
  const candidates: Candidate[] = [];

  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const tags = sharedTags(notes[i], notes[j]);
      if (tags.length > 0) {
        candidates.push({ a: notes[i], b: notes[j], tags });
      }
    }
  }

  candidates.sort((x, y) => y.tags.length - x.tags.length);

  const bridges: TagBridge[] = [];
  const added = new Set<string>();

  for (const { a, b, tags } of candidates) {
    let needed = false;
    for (const tag of tags) {
      const uf = tagUfs.get(tag);
      if (!uf) continue;
      if (uf.find(a.id) !== uf.find(b.id)) {
        uf.union(a.id, b.id);
        needed = true;
      }
    }
    if (!needed) continue;

    const key = pairKey(a.id, b.id);
    if (added.has(key)) continue;
    added.add(key);

    const kind = bridgeKind(tags.length);
    bridges.push({
      sourceId: a.id,
      targetId: b.id,
      tags,
      kind,
      priority: bridgePriority(kind),
    });
  }

  bridges.sort((a, b) => a.priority - b.priority);
  return bridges;
}

/** Stable HSL wood tone per tag name (global across continents). */
export function colorForTag(tag: string): string {
  const rng = rngFor(`tag:${tag}`);
  const hue = rng() * 360;
  return `hsl(${hue}, 42%, 48%)`;
}
