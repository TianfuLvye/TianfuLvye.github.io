import {
  GRID_BUILDABLE_INSET,
  GRID_CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  MAP_SIZE,
  type BuildingGridSpan,
} from './map-config';
import { rangeFrom } from './random';

export interface GridCell {
  col: number;
  row: number;
}

/** Fractional positions within a cell for multiple plants (0–1 from cell corner). */
const SUB_CELL_FRACTIONS: Array<[number, number]> = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75],
  [0.5, 0.35],
  [0.5, 0.65],
  [0.35, 0.5],
  [0.65, 0.5],
];

export function isInBounds(col: number, row: number): boolean {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

export function isBuildableCell(col: number, row: number): boolean {
  const inset = GRID_BUILDABLE_INSET;
  return (
    col >= inset &&
    col < GRID_COLS - inset &&
    row >= inset &&
    row < GRID_ROWS - inset
  );
}

/** World-space center of a grid cell (building anchor). */
export function cellCenter(col: number, row: number): [number, number] {
  const half = MAP_SIZE / 2;
  const x = (col + 0.5) * GRID_CELL_SIZE - half;
  const z = (row + 0.5) * GRID_CELL_SIZE - half;
  return [x, z];
}

/** Deterministic sub-position inside a cell for multiple plants. */
export function subCellWorldPosition(
  col: number,
  row: number,
  slot: number,
  rng?: () => number,
): [number, number] {
  const half = MAP_SIZE / 2;
  const cellLeft = col * GRID_CELL_SIZE - half;
  const cellBottom = row * GRID_CELL_SIZE - half;
  const [fx, fz] = SUB_CELL_FRACTIONS[slot % SUB_CELL_FRACTIONS.length];
  let x = cellLeft + fx * GRID_CELL_SIZE;
  let z = cellBottom + fz * GRID_CELL_SIZE;
  if (rng) {
    const jitter = GRID_CELL_SIZE * 0.08;
    x += rangeFrom(rng, -jitter, jitter);
    z += rangeFrom(rng, -jitter, jitter);
  }
  return [x, z];
}

export function neighbors4(col: number, row: number): GridCell[] {
  const out: GridCell[] = [];
  for (const [dc, dr] of [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ] as const) {
    const nc = col + dc;
    const nr = row + dr;
    if (isInBounds(nc, nr)) out.push({ col: nc, row: nr });
  }
  return out;
}

export function chebyshevDistance(
  a: GridCell,
  b: GridCell,
): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

export function allCells(): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      cells.push({ col, row });
    }
  }
  return cells;
}

export function buildableCells(): GridCell[] {
  return allCells().filter((c) => isBuildableCell(c.col, c.row));
}

export function overflowCells(): GridCell[] {
  return allCells().filter((c) => !isBuildableCell(c.col, c.row));
}

/** All cells in an N×N block anchored at top-left. */
export function blockCells(
  anchorCol: number,
  anchorRow: number,
  span: number,
): GridCell[] {
  const cells: GridCell[] = [];
  for (let dr = 0; dr < span; dr++) {
    for (let dc = 0; dc < span; dc++) {
      cells.push({ col: anchorCol + dc, row: anchorRow + dr });
    }
  }
  return cells;
}

export function isBlockInBounds(
  anchorCol: number,
  anchorRow: number,
  span: number,
): boolean {
  return (
    isInBounds(anchorCol, anchorRow) &&
    isInBounds(anchorCol + span - 1, anchorRow + span - 1)
  );
}

export function isBlockBuildable(
  anchorCol: number,
  anchorRow: number,
  span: number,
): boolean {
  return blockCells(anchorCol, anchorRow, span).every((c) =>
    isBuildableCell(c.col, c.row),
  );
}

/** World XZ center of an odd N×N block (anchor = top-left). */
export function blockCenter(
  anchorCol: number,
  anchorRow: number,
  span: number,
): [number, number] {
  const centerCol = anchorCol + (span - 1) / 2;
  const centerRow = anchorRow + (span - 1) / 2;
  return cellCenter(centerCol, centerRow);
}

export function buildingGridCells(
  anchorCol: number,
  anchorRow: number,
  span: BuildingGridSpan,
): GridCell[] {
  return blockCells(anchorCol, anchorRow, span);
}

export function buildingWorldCenter(
  anchorCol: number,
  anchorRow: number,
  span: BuildingGridSpan,
): [number, number] {
  return blockCenter(anchorCol, anchorRow, span);
}

/** Footprint plus a Chebyshev margin (for BUILDING_MIN_GAP). */
export function blockCellsWithMargin(
  anchorCol: number,
  anchorRow: number,
  span: number,
  margin: number,
): GridCell[] {
  const cells: GridCell[] = [];
  const minCol = anchorCol - margin;
  const maxCol = anchorCol + span - 1 + margin;
  const minRow = anchorRow - margin;
  const maxRow = anchorRow + span - 1 + margin;
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (isInBounds(col, row)) cells.push({ col, row });
    }
  }
  return cells;
}

export function allBlockAnchors(span: number): GridCell[] {
  const anchors: GridCell[] = [];
  for (let row = 0; row <= GRID_ROWS - span; row++) {
    for (let col = 0; col <= GRID_COLS - span; col++) {
      anchors.push({ col, row });
    }
  }
  return anchors;
}

export function buildableBlockAnchors(span: number): GridCell[] {
  return allBlockAnchors(span).filter((a) =>
    isBlockBuildable(a.col, a.row, span),
  );
}

export function overflowBlockAnchors(span: number): GridCell[] {
  return allBlockAnchors(span).filter(
    (a) => !isBlockBuildable(a.col, a.row, span),
  );
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function shuffleCells<T>(items: T[], rng: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

export class GridOccupancy {
  private buildings = new Map<string, string>();
  private forests = new Map<string, number>();
  private flowerPatches = new Set<string>();
  private plantCounts = new Map<string, number>();

  private key(col: number, row: number): string {
    return cellKey(col, row);
  }

  markBuildingCells(cells: GridCell[], noteId: string): void {
    for (const { col, row } of cells) {
      this.setBuilding(col, row, noteId);
    }
  }

  setBuilding(col: number, row: number, noteId: string): void {
    this.buildings.set(cellKey(col, row), noteId);
  }

  hasBuilding(col: number, row: number): boolean {
    return this.buildings.has(cellKey(col, row));
  }

  setForest(col: number, row: number, forestId: number): void {
    this.forests.set(cellKey(col, row), forestId);
  }

  hasForest(col: number, row: number): boolean {
    return this.forests.has(cellKey(col, row));
  }

  getBuildingCells(): GridCell[] {
    const out: GridCell[] = [];
    for (const k of this.buildings.keys()) {
      const [col, row] = k.split(',').map(Number);
      out.push({ col, row });
    }
    return out;
  }

  getForestSeedCells(): GridCell[] {
    const seen = new Set<number>();
    const seeds: GridCell[] = [];
    for (const forestId of this.forests.values()) {
      if (seen.has(forestId)) continue;
      seen.add(forestId);
      for (const [k, id] of this.forests.entries()) {
        if (id !== forestId) continue;
        const [col, row] = k.split(',').map(Number);
        seeds.push({ col, row });
        break;
      }
    }
    return seeds;
  }

  allForestCells(): GridCell[] {
    const out: GridCell[] = [];
    for (const k of this.forests.keys()) {
      const [col, row] = k.split(',').map(Number);
      out.push({ col, row });
    }
    return out;
  }

  setFlowerPatch(col: number, row: number): void {
    this.flowerPatches.add(this.key(col, row));
  }

  hasFlowerPatch(col: number, row: number): boolean {
    return this.flowerPatches.has(this.key(col, row));
  }

  incrementPlants(col: number, row: number): void {
    const k = this.key(col, row);
    this.plantCounts.set(k, (this.plantCounts.get(k) ?? 0) + 1);
  }

  isOccupiedForWild(col: number, row: number): boolean {
    return (
      this.hasBuilding(col, row) ||
      this.hasForest(col, row) ||
      this.hasFlowerPatch(col, row)
    );
  }

  minChebyshevToBuilding(col: number, row: number): number {
    const cells = this.getBuildingCells();
    if (cells.length === 0) return Infinity;
    let min = Infinity;
    for (const b of cells) {
      min = Math.min(min, chebyshevDistance({ col, row }, b));
    }
    return min;
  }

  minChebyshevToForest(col: number, row: number): number {
    const seeds = this.getForestSeedCells();
    if (seeds.length === 0) return Infinity;
    let min = Infinity;
    for (const s of seeds) {
      min = Math.min(min, chebyshevDistance({ col, row }, s));
    }
    return min;
  }
}

/** Line segments for grid overlay: pairs of [x,y,z] points. */
export function gridLineSegments(y = 0.02): Array<[[number, number, number], [number, number, number]]> {
  const half = MAP_SIZE / 2;
  const segments: Array<[[number, number, number], [number, number, number]]> = [];

  for (let col = 0; col <= GRID_COLS; col++) {
    const x = col * GRID_CELL_SIZE - half;
    segments.push([
      [x, y, -half],
      [x, y, half],
    ]);
  }

  for (let row = 0; row <= GRID_ROWS; row++) {
    const z = row * GRID_CELL_SIZE - half;
    segments.push([
      [-half, y, z],
      [half, y, z],
    ]);
  }

  return segments;
}
