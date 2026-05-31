import { NEIGHBOR4_OFFSETS } from './direction';
import { type ContinentMapConfig } from './map-config';
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
  for (const { dc, dr } of NEIGHBOR4_OFFSETS) {
    const nc = col + dc;
    const nr = row + dr;
    if (isInBounds(cfg, nc, nr)) out.push({ col: nc, row: nr });
  }
  return out;
}

/** Chebyshev (chessboard) distance between two integer points. */
export function chebyshev(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function chebyshevDistance(
  a: GridCell,
  b: GridCell,
): number {
  return chebyshev(a.col, a.row, b.col, b.row);
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

/**
 * cellKey 的逆操作。用 limit=2 的 split,因此既能解析二段的 "col,row",
 * 也能从三段的 A* 状态键 "col,row,dir" 中取出格坐标。
 */
export function parseCellKey(key: string): GridCell {
  const [col, row] = key.split(',', 2).map(Number);
  return { col, row };
}

export function shuffleCells<T>(items: T[], rng: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
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
