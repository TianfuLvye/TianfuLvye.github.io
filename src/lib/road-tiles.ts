import type { RoadTileKind } from '../config/road-catalog';
import type { RoadSegment } from './place-roads';
import { cellKey, type GridCell } from './grid';

/** N=1, E=2, S=4, W=8 */
const DIR_N = 1;
const DIR_E = 2;
const DIR_S = 4;
const DIR_W = 8;

export interface RoadTileInstance {
  col: number;
  row: number;
  kind: RoadTileKind;
  /** Connection bitmask (N=1, E=2, S=4, W=8). */
  mask: number;
  rotationY: number;
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

function maskForCell(cell: GridCell, pathSet: Set<string>): number {
  let mask = 0;
  for (const n of [
    { col: cell.col, row: cell.row - 1 },
    { col: cell.col + 1, row: cell.row },
    { col: cell.col, row: cell.row + 1 },
    { col: cell.col - 1, row: cell.row },
  ]) {
    if (pathSet.has(cellKey(n.col, n.row))) {
      mask |= directionBetween(cell, n);
    }
  }
  return mask;
}

function isOppositePair(mask: number): boolean {
  return mask === (DIR_N | DIR_S) || mask === (DIR_E | DIR_W);
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
  const count =
    (mask & DIR_N ? 1 : 0) +
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

function neighborCount(mask: number): number {
  return (
    (mask & DIR_N ? 1 : 0) +
    (mask & DIR_E ? 1 : 0) +
    (mask & DIR_S ? 1 : 0) +
    (mask & DIR_W ? 1 : 0)
  );
}

/** One road GLB per fine grid cell on active tag paths. */
export function mergeActiveRoadTiles(
  segments: RoadSegment[],
  activeTags: string[],
): RoadTileInstance[] {
  if (activeTags.length === 0) return [];

  const active = new Set(activeTags);
  const filtered = segments.filter((s) => active.has(s.tag));
  if (filtered.length === 0) return [];

  const cellKeys = new Set<string>();
  const allPathCells = new Set<string>();
  const doorFacingByKey = new Map<string, number>();

  for (const segment of filtered) {
    for (const terminal of segment.doorTerminals) {
      doorFacingByKey.set(
        cellKey(terminal.col, terminal.row),
        terminal.facingMask,
      );
    }
    for (const cell of segment.gridCells) {
      const key = cellKey(cell.col, cell.row);
      allPathCells.add(key);
      cellKeys.add(key);
    }
  }

  const tiles: RoadTileInstance[] = [];
  for (const key of cellKeys) {
    const [col, row] = key.split(',').map(Number);
    const connectivityMask = maskForCell({ col, row }, allPathCells);
    if (connectivityMask === 0) continue;

    const doorFacing = doorFacingByKey.get(key);
    if (
      doorFacing !== undefined &&
      neighborCount(connectivityMask) === 1
    ) {
      tiles.push({
        col,
        row,
        kind: 'end',
        mask: doorFacing,
        rotationY: rotationForEnd(doorFacing),
      });
      continue;
    }

    const { kind, rotationY } = pickTileFromMask(connectivityMask);
    tiles.push({ col, row, kind, mask: connectivityMask, rotationY });
  }

  tiles.sort((a, b) =>
    a.col !== b.col ? a.col - b.col : a.row - b.row,
  );
  return tiles;
}
