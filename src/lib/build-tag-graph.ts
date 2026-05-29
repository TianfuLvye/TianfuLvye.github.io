import type { NoteData } from './types';

export interface TagEdge {
  tag: string;
  sourceId: string;
  targetId: string;
}

export type Position2D = readonly [number, number];

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

function chebyshevDistance(a: Position2D, b: Position2D): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
}

function collectTags(notes: NoteData[]): string[] {
  const tags = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) tags.add(tag);
  }
  return [...tags].sort();
}

function spanningTreeForTag(
  tag: string,
  notes: NoteData[],
  positions: Map<string, Position2D>,
): TagEdge[] {
  const tagged = notes.filter((n) => n.tags.includes(tag));
  if (tagged.length < 2) return [];

  const candidates: Array<{
    a: NoteData;
    b: NoteData;
    distance: number;
    key: string;
  }> = [];

  for (let i = 0; i < tagged.length; i++) {
    for (let j = i + 1; j < tagged.length; j++) {
      const a = tagged[i];
      const b = tagged[j];
      const pa = positions.get(a.id);
      const pb = positions.get(b.id);
      const distance =
        pa && pb
          ? chebyshevDistance(pa, pb)
          : Math.abs(a.id.localeCompare(b.id));
      candidates.push({ a, b, distance, key: pairKey(a.id, b.id) });
    }
  }

  candidates.sort((x, y) => {
    if (x.distance !== y.distance) return x.distance - y.distance;
    return x.key.localeCompare(y.key);
  });

  const uf = new UnionFind();
  for (const note of tagged) uf.ensure(note.id);

  const edges: TagEdge[] = [];
  for (const { a, b } of candidates) {
    if (uf.union(a.id, b.id)) {
      edges.push({ tag, sourceId: a.id, targetId: b.id });
    }
  }

  return edges;
}

/** Per-tag spanning forests: each tag with k notes gets up to k−1 edges. */
export function buildTagGraph(
  notes: NoteData[],
  positions: Map<string, Position2D>,
): Map<string, TagEdge[]> {
  const graph = new Map<string, TagEdge[]>();
  for (const tag of collectTags(notes)) {
    const edges = spanningTreeForTag(tag, notes, positions);
    if (edges.length > 0) graph.set(tag, edges);
  }
  return graph;
}

/** Flat list of all tag edges. */
export function flattenTagEdges(graph: Map<string, TagEdge[]>): TagEdge[] {
  const out: TagEdge[] = [];
  for (const edges of graph.values()) out.push(...edges);
  return out;
}
