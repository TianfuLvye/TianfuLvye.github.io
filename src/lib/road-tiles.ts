import type { RoadTileKind } from '../config/road-catalog';
import type { RoadSegment } from './place-roads';
import { cellKey, parseCellKey, type GridCell } from './grid';
import {
  DIR_N,
  DIR_E,
  DIR_S,
  DIR_W,
  DIR_BIT,
  NEIGHBOR4_OFFSETS,
  dirFromDelta,
} from './direction';

export interface RoadTileInstance {
  col: number;
  row: number;
  kind: RoadTileKind;
  /** Connection bitmask (N=1, E=2, S=4, W=8). */
  mask: number;
}

function directionBetween(a: GridCell, b: GridCell): number {
  const dir = dirFromDelta(b.col - a.col, b.row - a.row);
  return dir ? DIR_BIT[dir] : 0;
}

function maskForCell(cell: GridCell, pathSet: Set<string>): number {
  let mask = 0;
  for (const { dc, dr } of NEIGHBOR4_OFFSETS) {
    const n = { col: cell.col + dc, row: cell.row + dr };
    if (pathSet.has(cellKey(n.col, n.row))) {
      mask |= directionBetween(cell, n);
    }
  }
  return mask;
}

function isOppositePair(mask: number): boolean {
  return mask === (DIR_N | DIR_S) || mask === (DIR_E | DIR_W);
}

function pickTileKindFromMask(mask: number): RoadTileKind {
  const count =
    (mask & DIR_N ? 1 : 0) +
    (mask & DIR_E ? 1 : 0) +
    (mask & DIR_S ? 1 : 0) +
    (mask & DIR_W ? 1 : 0);

  if (count === 1) return 'end';
  if (count === 2) {
    return isOppositePair(mask) ? 'straight' : 'bend';
  }
  if (count === 3) return 'tJunction';
  return 'cross';
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
    const { col, row } = parseCellKey(key);
    const connectivityMask = maskForCell({ col, row }, allPathCells);
    if (connectivityMask === 0) continue;

    const doorFacing = doorFacingByKey.get(key);
    if (doorFacing !== undefined) {
      tiles.push({
        col,
        row,
        kind: 'end',
        mask: doorFacing,
      });
      continue;
    }

    tiles.push({
      col,
      row,
      kind: pickTileKindFromMask(connectivityMask),
      mask: connectivityMask,
    });
  }

  tiles.sort((a, b) =>
    a.col !== b.col ? a.col - b.col : a.row - b.row,
  );
  return tiles;
}
