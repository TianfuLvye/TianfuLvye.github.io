import {
  type BuildingGridSpan,
  type ContinentMapConfig,
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

export function isInBounds(
  cfg: ContinentMapConfig,
  col: number,
  row: number,
): boolean {
  return col >= 0 && col < cfg.gridCols && row >= 0 && row < cfg.gridRows;
}

export function isBuildableCell(
  cfg: ContinentMapConfig,
  col: number,
  row: number,
): boolean {
  const inset = cfg.buildableInset;
  return (
    col >= inset &&
    col < cfg.gridCols - inset &&
    row >= inset &&
    row < cfg.gridRows - inset
  );
}

/** World-space center of a grid cell (building anchor). */
export function cellCenter(
  cfg: ContinentMapConfig,
  col: number,
  row: number,
): [number, number] {
  const half = cfg.mapSize / 2;
  const x = (col + 0.5) * cfg.cellSize - half;
  const z = (row + 0.5) * cfg.cellSize - half;
  return [x, z];
}

/** Deterministic sub-position inside a cell for multiple plants. */
export function subCellWorldPosition(
  cfg: ContinentMapConfig,
  col: number,
  row: number,
  slot: number,
  rng?: () => number,
): [number, number] {
  const half = cfg.mapSize / 2;
  const cellLeft = col * cfg.cellSize - half;
  const cellBottom = row * cfg.cellSize - half;
  const [fx, fz] = SUB_CELL_FRACTIONS[slot % SUB_CELL_FRACTIONS.length];
  let x = cellLeft + fx * cfg.cellSize;
  let z = cellBottom + fz * cfg.cellSize;
  if (rng) {
    const jitter = cfg.cellSize * 0.08;
    x += rangeFrom(rng, -jitter, jitter);
    z += rangeFrom(rng, -jitter, jitter);
  }
  return [x, z];
}

export function neighbors4(
  cfg: ContinentMapConfig,
  col: number,
  row: number,
): GridCell[] {
  const out: GridCell[] = [];
  for (const [dc, dr] of [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ] as const) {
    const nc = col + dc;
    const nr = row + dr;
    if (isInBounds(cfg, nc, nr)) out.push({ col: nc, row: nr });
  }
  return out;
}

export function chebyshevDistance(
  a: GridCell,
  b: GridCell,
): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

export function allCells(cfg: ContinentMapConfig): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < cfg.gridRows; row++) {
    for (let col = 0; col < cfg.gridCols; col++) {
      cells.push({ col, row });
    }
  }
  return cells;
}

export function buildableCells(cfg: ContinentMapConfig): GridCell[] {
  return allCells(cfg).filter((c) => isBuildableCell(cfg, c.col, c.row));
}

export function overflowCells(cfg: ContinentMapConfig): GridCell[] {
  return allCells(cfg).filter((c) => !isBuildableCell(cfg, c.col, c.row));
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
  cfg: ContinentMapConfig,
  anchorCol: number,
  anchorRow: number,
  span: number,
): boolean {
  return (
    isInBounds(cfg, anchorCol, anchorRow) &&
    isInBounds(cfg, anchorCol + span - 1, anchorRow + span - 1)
  );
}

export function isBlockBuildable(
  cfg: ContinentMapConfig,
  anchorCol: number,
  anchorRow: number,
  span: number,
): boolean {
  return blockCells(anchorCol, anchorRow, span).every((c) =>
    isBuildableCell(cfg, c.col, c.row),
  );
}

/** World XZ center of an odd N×N block (anchor = top-left). */
export function blockCenter(
  cfg: ContinentMapConfig,
  anchorCol: number,
  anchorRow: number,
  span: number,
): [number, number] {
  const centerCol = anchorCol + (span - 1) / 2;
  const centerRow = anchorRow + (span - 1) / 2;
  return cellCenter(cfg, centerCol, centerRow);
}

export function buildingGridCells(
  anchorCol: number,
  anchorRow: number,
  span: BuildingGridSpan,
): GridCell[] {
  return blockCells(anchorCol, anchorRow, span);
}

export function buildingWorldCenter(
  cfg: ContinentMapConfig,
  anchorCol: number,
  anchorRow: number,
  span: BuildingGridSpan,
): [number, number] {
  return blockCenter(cfg, anchorCol, anchorRow, span);
}

/** Footprint plus a Chebyshev margin (for BUILDING_MIN_GAP). */
export function blockCellsWithMargin(
  cfg: ContinentMapConfig,
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
      if (isInBounds(cfg, col, row)) cells.push({ col, row });
    }
  }
  return cells;
}

export function allBlockAnchors(
  cfg: ContinentMapConfig,
  span: number,
): GridCell[] {
  const anchors: GridCell[] = [];
  for (let row = 0; row <= cfg.gridRows - span; row++) {
    for (let col = 0; col <= cfg.gridCols - span; col++) {
      anchors.push({ col, row });
    }
  }
  return anchors;
}

export function buildableBlockAnchors(
  cfg: ContinentMapConfig,
  span: number,
): GridCell[] {
  return allBlockAnchors(cfg, span).filter((a) =>
    isBlockBuildable(cfg, a.col, a.row, span),
  );
}

export function overflowBlockAnchors(
  cfg: ContinentMapConfig,
  span: number,
): GridCell[] {
  return allBlockAnchors(cfg, span).filter(
    (a) => !isBlockBuildable(cfg, a.col, a.row, span),
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
  private forestSeeds = new Map<number, GridCell>();
  private flowerPatches = new Set<string>();
  private plantCounts = new Map<string, number>();
  private buildingDist: Float32Array | null = null;

  constructor(private readonly cfg: ContinentMapConfig) {}

  private key(col: number, row: number): string {
    return cellKey(col, row);
  }

  markBuildingCells(cells: GridCell[], noteId: string): void {
    for (const { col, row } of cells) {
      this.setBuilding(col, row, noteId);
    }
    this.buildingDist = null;
  }

  setBuilding(col: number, row: number, noteId: string): void {
    this.buildings.set(cellKey(col, row), noteId);
    this.buildingDist = null;
  }

  hasBuilding(col: number, row: number): boolean {
    return this.buildings.has(cellKey(col, row));
  }

  setForest(
    col: number,
    row: number,
    forestId: number,
    isSeed = false,
  ): void {
    this.forests.set(cellKey(col, row), forestId);
    if (isSeed || !this.forestSeeds.has(forestId)) {
      this.forestSeeds.set(forestId, { col, row });
    }
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
    return [...this.forestSeeds.values()];
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

  private ensureBuildingDist(): void {
    if (this.buildingDist) return;

    const { gridCols, gridRows } = this.cfg;
    const dist = new Float32Array(gridCols * gridRows);
    dist.fill(Infinity);
    const buildingCells = this.getBuildingCells();
    if (buildingCells.length === 0) {
      this.buildingDist = dist;
      return;
    }

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        let min = Infinity;
        for (const b of buildingCells) {
          min = Math.min(min, chebyshevDistance({ col, row }, b));
        }
        dist[row * gridCols + col] = min;
      }
    }
    this.buildingDist = dist;
  }

  minChebyshevToBuilding(col: number, row: number): number {
    this.ensureBuildingDist();
    return this.buildingDist![row * this.cfg.gridCols + col];
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
export function gridLineSegments(
  cfg: ContinentMapConfig,
  y = 0.02,
): Array<[[number, number, number], [number, number, number]]> {
  const half = cfg.mapSize / 2;
  const segments: Array<[[number, number, number], [number, number, number]]> = [];

  for (let col = 0; col <= cfg.gridCols; col++) {
    const x = col * cfg.cellSize - half;
    segments.push([
      [x, y, -half],
      [x, y, half],
    ]);
  }

  for (let row = 0; row <= cfg.gridRows; row++) {
    const z = row * cfg.cellSize - half;
    segments.push([
      [-half, y, z],
      [half, y, z],
    ]);
  }

  return segments;
}
