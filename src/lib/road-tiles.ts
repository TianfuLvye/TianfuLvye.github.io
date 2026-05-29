import type { RoadTileKind } from '../config/road-catalog';
import { colorForTag } from './tag-colors';
import type { RoadSegment } from './place-roads';
import { cellKey, type GridCell } from './grid';

/** N=1, E=2, S=4, W=8 */
export const DIR_N = 1;
export const DIR_E = 2;
export const DIR_S = 4;
export const DIR_W = 8;

export interface RoadTileInstance {
  col: number;
  row: number;
  kind: RoadTileKind;
  rotationY: number;
  tags: string[];
  overlap: number;
  tint: string;
  emissiveIntensity: number;
}

function directionBetween(a: GridCell, b: GridCell): number {
  const dc = b.col - a.col;
  const dr = b.row - a.row;
  if (dc === 1 && dr === 0) return DIR_E;
  if (dc === -1 && dr === 0) return DIR_W;
  if (dc === 0 && dr === 1) return DIR_S;
  if (dc === 0 && dr === -1) return DIR_N;
  return 0;
}

function addDirection(mask: number, dir: number): number {
  return mask | dir;
}

function maskForCell(
  cell: GridCell,
  pathSet: Set<string>,
): number {
  let mask = 0;
  for (const n of [
    { col: cell.col, row: cell.row - 1 },
    { col: cell.col + 1, row: cell.row },
    { col: cell.col, row: cell.row + 1 },
    { col: cell.col - 1, row: cell.row },
  ]) {
    if (pathSet.has(cellKey(n.col, n.row))) {
      mask = addDirection(mask, directionBetween(cell, n));
    }
  }
  return mask;
}

function isOppositePair(mask: number): boolean {
  return (
    mask === (DIR_N | DIR_S) ||
    mask === (DIR_E | DIR_W)
  );
}

function rotationForStraight(mask: number): number {
  if (mask === (DIR_E | DIR_W)) return Math.PI / 2;
  return 0;
}

function rotationForBend(mask: number): number {
  const table: Record<number, number> = {
    [DIR_N | DIR_E]: 0,
    [DIR_E | DIR_S]: Math.PI / 2,
    [DIR_S | DIR_W]: Math.PI,
    [DIR_W | DIR_N]: -Math.PI / 2,
  };
  return table[mask] ?? 0;
}

function rotationForEnd(mask: number): number {
  const table: Record<number, number> = {
    [DIR_N]: 0,
    [DIR_E]: Math.PI / 2,
    [DIR_S]: Math.PI,
    [DIR_W]: -Math.PI / 2,
  };
  return table[mask] ?? 0;
}

function rotationForTJunction(mask: number): number {
  const table: Record<number, number> = {
    [DIR_E | DIR_S | DIR_W]: 0,
    [DIR_N | DIR_S | DIR_W]: Math.PI / 2,
    [DIR_N | DIR_E | DIR_W]: Math.PI,
    [DIR_N | DIR_E | DIR_S]: -Math.PI / 2,
  };
  return table[mask] ?? 0;
}

function pickTileFromMask(mask: number): {
  kind: RoadTileKind;
  rotationY: number;
} {
  const count = (mask & DIR_N ? 1 : 0) +
    (mask & DIR_E ? 1 : 0) +
    (mask & DIR_S ? 1 : 0) +
    (mask & DIR_W ? 1 : 0);

  if (count === 1) {
    return { kind: 'end', rotationY: rotationForEnd(mask) };
  }
  if (count === 2) {
    if (isOppositePair(mask)) {
      return { kind: 'straight', rotationY: rotationForStraight(mask) };
    }
    return { kind: 'bend', rotationY: rotationForBend(mask) };
  }
  if (count === 3) {
    return { kind: 'tJunction', rotationY: rotationForTJunction(mask) };
  }
  return { kind: 'cross', rotationY: 0 };
}

function blendTagColors(tags: string[]): string {
  if (tags.length === 0) return '#8b6914';
  if (tags.length === 1) return colorForTag(tags[0]);

  let r = 0;
  let g = 0;
  let b = 0;
  for (const tag of tags) {
    const hex = colorForTag(tag);
    const n = parseInt(hex.slice(1), 16);
    r += (n >> 16) & 255;
    g += (n >> 8) & 255;
    b += n & 255;
  }
  const n = tags.length;
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Merge active tag road paths into one tile per grid cell. */
export function mergeActiveRoadTiles(
  segments: RoadSegment[],
  activeTags: string[],
): RoadTileInstance[] {
  if (activeTags.length === 0) return [];

  const active = new Set(activeTags);
  const filtered = segments.filter((s) => active.has(s.tag));
  if (filtered.length === 0) return [];

  const cellTags = new Map<string, Set<string>>();
  const allPathCells = new Set<string>();

  for (const segment of filtered) {
    for (const cell of segment.gridCells) {
      const key = cellKey(cell.col, cell.row);
      allPathCells.add(key);
      if (!cellTags.has(key)) cellTags.set(key, new Set());
      cellTags.get(key)!.add(segment.tag);
    }
  }

  const tiles: RoadTileInstance[] = [];
  for (const [key, tags] of cellTags) {
    const [col, row] = key.split(',').map(Number);
    const tagList = [...tags].sort();
    const mask = maskForCell({ col, row }, allPathCells);
    if (mask === 0) continue;

    const { kind, rotationY } = pickTileFromMask(mask);
    const overlap = tagList.length;
    tiles.push({
      col,
      row,
      kind,
      rotationY,
      tags: tagList,
      overlap,
      tint: blendTagColors(tagList),
      emissiveIntensity: 0.08 + 0.08 * overlap,
    });
  }

  tiles.sort((a, b) =>
    a.col !== b.col ? a.col - b.col : a.row - b.row,
  );
  return tiles;
}
