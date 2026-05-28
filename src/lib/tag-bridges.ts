import { rngFor, hashString } from './random';
import type { NoteData, TagBridge, TagBridgeKind } from './types';

export type Position2D = readonly [number, number];

const MAX_BRIDGE_DEGREE = 3;

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

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
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

export function distanceBetween(
  positions: Map<string, Position2D> | undefined,
  aId: string,
  bId: string,
): number {
  const pa = positions?.get(aId);
  const pb = positions?.get(bId);
  if (pa && pb) return Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
  return Math.abs(aId.localeCompare(bId));
}

type Candidate = {
  a: NoteData;
  b: NoteData;
  tags: string[];
  distance: number;
  key: string;
};

function compareCandidates(
  x: Candidate,
  y: Candidate,
  degree: Map<string, number>,
): number {
  if (y.tags.length !== x.tags.length) return y.tags.length - x.tags.length;
  if (x.distance !== y.distance) return x.distance - y.distance;
  const dx = (degree.get(x.a.id) ?? 0) + (degree.get(x.b.id) ?? 0);
  const dy = (degree.get(y.a.id) ?? 0) + (degree.get(y.b.id) ?? 0);
  if (dx !== dy) return dx - dy;
  return x.key.localeCompare(y.key);
}

function buildCandidates(
  notes: NoteData[],
  positions?: Map<string, Position2D>,
): Candidate[] {
  const candidates: Candidate[] = [];
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const tags = sharedTags(notes[i], notes[j]);
      if (tags.length === 0) continue;
      const a = notes[i];
      const b = notes[j];
      candidates.push({
        a,
        b,
        tags,
        distance: distanceBetween(positions, a.id, b.id),
        key: pairKey(a.id, b.id),
      });
    }
  }
  return candidates;
}

function tagsNeedingEdge(
  candidate: Candidate,
  tagUfs: Map<string, UnionFind>,
): string[] {
  return candidate.tags.filter((tag) => {
    const uf = tagUfs.get(tag);
    return uf && !uf.connected(candidate.a.id, candidate.b.id);
  });
}

function applyEdge(
  candidate: Candidate,
  neededTags: string[],
  tagUfs: Map<string, UnionFind>,
  degree: Map<string, number>,
  bridges: TagBridge[],
  added: Set<string>,
): void {
  for (const tag of neededTags) {
    tagUfs.get(tag)!.union(candidate.a.id, candidate.b.id);
  }

  if (added.has(candidate.key)) return;
  added.add(candidate.key);

  degree.set(candidate.a.id, (degree.get(candidate.a.id) ?? 0) + 1);
  degree.set(candidate.b.id, (degree.get(candidate.b.id) ?? 0) + 1);

  const kind = bridgeKind(candidate.tags.length);
  bridges.push({
    sourceId: candidate.a.id,
    targetId: candidate.b.id,
    tags: candidate.tags,
    kind,
    priority: bridgePriority(kind),
  });
}

function selectEdges(
  candidates: Candidate[],
  tagUfs: Map<string, UnionFind>,
  bridges: TagBridge[],
  added: Set<string>,
  degree: Map<string, number>,
  enforceDegreeCap: boolean,
): void {
  const sorted = [...candidates].sort((x, y) =>
    compareCandidates(x, y, degree),
  );

  for (const candidate of sorted) {
    const neededTags = tagsNeedingEdge(candidate, tagUfs);
    if (neededTags.length === 0) continue;

    const degA = degree.get(candidate.a.id) ?? 0;
    const degB = degree.get(candidate.b.id) ?? 0;
    if (
      enforceDegreeCap &&
      degA >= MAX_BRIDGE_DEGREE &&
      degB >= MAX_BRIDGE_DEGREE
    ) {
      continue;
    }

    applyEdge(candidate, neededTags, tagUfs, degree, bridges, added);
  }
}

/**
 * Per-continent spanning forests: each tag with k notes gets k−1 physical bridges.
 * Prefers rainbow/dual pairs, then shorter edges, then lower-degree nodes.
 */
export function buildTagBridges(
  notes: NoteData[],
  positions?: Map<string, Position2D>,
): TagBridge[] {
  if (notes.length < 2) return [];

  const tagUfs = new Map<string, UnionFind>();
  for (const note of notes) {
    for (const tag of note.tags) {
      if (!tagUfs.has(tag)) tagUfs.set(tag, new UnionFind());
      tagUfs.get(tag)!.ensure(note.id);
    }
  }

  const candidates = buildCandidates(notes, positions);
  const bridges: TagBridge[] = [];
  const added = new Set<string>();
  const degree = new Map<string, number>();

  selectEdges(candidates, tagUfs, bridges, added, degree, true);
  selectEdges(candidates, tagUfs, bridges, added, degree, false);

  bridges.sort((a, b) => a.priority - b.priority);
  return bridges;
}

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

/** Sum of bridge degrees per note — useful for tests. */
export function bridgeDegrees(bridges: TagBridge[]): Map<string, number> {
  const degree = new Map<string, number>();
  for (const bridge of bridges) {
    degree.set(bridge.sourceId, (degree.get(bridge.sourceId) ?? 0) + 1);
    degree.set(bridge.targetId, (degree.get(bridge.targetId) ?? 0) + 1);
  }
  return degree;
}
