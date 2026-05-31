import type { NoteData } from './types';
import { UnionFind } from './structures/union-find';
import { chebyshev } from './grid';
import { collectTags } from './note-tags';

export interface TagEdge {
  tag: string;
  sourceId: string;
  targetId: string;
}

export type Position2D = readonly [number, number];

function chebyshevDistance(a: Position2D, b: Position2D): number {
  return chebyshev(a[0], a[1], b[0], b[1]);
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
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
