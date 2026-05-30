import {
  cellCenter,
  isBuildableCell,
  type GridCell,
  type GridOccupancy,
} from './grid';
import {
  FOREST_EDGE_CENTER_MAX,
  FOREST_EDGE_CENTER_MIN,
  FOREST_EDGE_FALLOFF,
  FOREST_ELLIPSE_COUNT,
  FOREST_ELLIPSE_RX_MAX,
  FOREST_ELLIPSE_RX_MIN,
  FOREST_ELLIPSE_RZ_MAX,
  FOREST_ELLIPSE_RZ_MIN,
  FOREST_MIN_BUILDING_DIST,
  FOREST_RIBBON_WIDTH,
  type ContinentMapConfig,
} from './map-config';
import { rangeFrom } from './random';

export type ForestZone =
  | {
      kind: 'ellipse';
      cx: number;
      cz: number;
      rx: number;
      rz: number;
      rotation: number;
    }
  | {
      kind: 'ribbon';
      cx: number;
      cz: number;
      length: number;
      width: number;
      rotation: number;
    };

type EdgeSide = 'north' | 'south' | 'east' | 'west';

function buildableHalfExtent(cfg: ContinentMapConfig): number {
  return cfg.mapSize / 2 - cfg.buildableInset * cfg.cellSize;
}

function rotateOffset(x: number, z: number, rotation: number): [number, number] {
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  return [x * c - z * s, x * s + z * c];
}

export function normalizedEllipseDistance(
  x: number,
  z: number,
  zone: Extract<ForestZone, { kind: 'ellipse' }>,
): number {
  const [lx, lz] = rotateOffset(x - zone.cx, z - zone.cz, -zone.rotation);
  const nx = lx / zone.rx;
  const nz = lz / zone.rz;
  return Math.hypot(nx, nz);
}

export function pointInForestZone(x: number, z: number, zone: ForestZone): boolean {
  if (zone.kind === 'ellipse') {
    return normalizedEllipseDistance(x, z, zone) <= FOREST_EDGE_FALLOFF;
  }

  const [along, across] = rotateOffset(x - zone.cx, z - zone.cz, -zone.rotation);
  return (
    Math.abs(along) <= zone.length / 2 &&
    Math.abs(across) <= zone.width / 2
  );
}

export function forestZoneWorldArea(zone: ForestZone): number {
  if (zone.kind === 'ellipse') {
    return Math.PI * zone.rx * zone.rz * FOREST_EDGE_FALLOFF ** 2;
  }
  return zone.length * zone.width;
}

function randomEdgeBiasedCenter(
  rng: () => number,
  half: number,
): [number, number] {
  const angle = rng() * Math.PI * 2;
  const distFrac = rangeFrom(rng, FOREST_EDGE_CENTER_MIN, FOREST_EDGE_CENTER_MAX);
  const r = distFrac * half;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function edgeRibbonZone(
  cfg: ContinentMapConfig,
  side: EdgeSide,
  rng: () => number,
): ForestZone {
  const half = buildableHalfExtent(cfg);
  const inset = FOREST_RIBBON_WIDTH / 2 + cfg.cellSize * 0.5;
  const jitter = rangeFrom(rng, -1.2, 1.2);

  switch (side) {
    case 'north':
      return {
        kind: 'ribbon',
        cx: jitter,
        cz: -half + inset,
        length: cfg.forestRibbonLength,
        width: FOREST_RIBBON_WIDTH,
        rotation: 0,
      };
    case 'south':
      return {
        kind: 'ribbon',
        cx: jitter,
        cz: half - inset,
        length: cfg.forestRibbonLength,
        width: FOREST_RIBBON_WIDTH,
        rotation: 0,
      };
    case 'west':
      return {
        kind: 'ribbon',
        cx: -half + inset,
        cz: jitter,
        length: cfg.forestRibbonLength,
        width: FOREST_RIBBON_WIDTH,
        rotation: Math.PI / 2,
      };
    case 'east':
      return {
        kind: 'ribbon',
        cx: half - inset,
        cz: jitter,
        length: cfg.forestRibbonLength,
        width: FOREST_RIBBON_WIDTH,
        rotation: Math.PI / 2,
      };
  }
}

function randomEllipseZone(
  cfg: ContinentMapConfig,
  rng: () => number,
): ForestZone {
  const half = buildableHalfExtent(cfg);
  const [cx, cz] = randomEdgeBiasedCenter(rng, half);
  const s = cfg.sideScale;
  return {
    kind: 'ellipse',
    cx,
    cz,
    rx: rangeFrom(rng, FOREST_ELLIPSE_RX_MIN, FOREST_ELLIPSE_RX_MAX) * s,
    rz: rangeFrom(rng, FOREST_ELLIPSE_RZ_MIN, FOREST_ELLIPSE_RZ_MAX) * s,
    rotation: rng() * Math.PI,
  };
}

function shuffleSides(rng: () => number): EdgeSide[] {
  const sides: EdgeSide[] = ['north', 'south', 'east', 'west'];
  for (let i = sides.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [sides[i], sides[j]] = [sides[j], sides[i]];
  }
  return sides;
}

/** Edge ribbons + perimeter-biased ellipses after buildings are placed. */
export function selectForestZones(
  cfg: ContinentMapConfig,
  rng: () => number,
  occupancy: GridOccupancy,
): ForestZone[] {
  const zones: ForestZone[] = [];
  const sides = shuffleSides(rng);

  // ~75% chance per edge → usually 2–3 ribbons, occasionally all four.
  for (const side of sides) {
    if (rng() < 0.75) {
      zones.push(edgeRibbonZone(cfg, side, rng));
    }
  }

  for (let i = 0; i < Math.max(FOREST_ELLIPSE_COUNT, Math.round(FOREST_ELLIPSE_COUNT * cfg.sideScale)); i++) {
    const zone = randomEllipseZone(cfg, rng);
    const centerCell = worldToCell(cfg, zone.cx, zone.cz);
    if (
      centerCell &&
      occupancy.minChebyshevToBuilding(centerCell.col, centerCell.row) *
        cfg.cellSize <
        FOREST_MIN_BUILDING_DIST
    ) {
      continue;
    }
    zones.push(zone);
  }

  return zones;
}

export function collectForestCells(
  cfg: ContinentMapConfig,
  zone: ForestZone,
  gridCells: GridCell[],
  forestId: number,
  occupancy: GridOccupancy,
): GridCell[] {
  const cells: GridCell[] = [];

  for (const cell of gridCells) {
    if (!isBuildableCell(cfg, cell.col, cell.row)) continue;
    if (occupancy.hasBuilding(cell.col, cell.row)) continue;
    if (occupancy.hasForest(cell.col, cell.row)) continue;

    const [x, z] = cellCenter(cfg, cell.col, cell.row);
    if (!pointInForestZone(x, z, zone)) continue;

    occupancy.setForest(cell.col, cell.row, forestId);
    cells.push(cell);
  }

  return cells;
}

export function randomPointInZone(
  rng: () => number,
  zone: ForestZone,
  maxAttempts = 24,
): [number, number] | null {
  if (zone.kind === 'ellipse') {
    for (let i = 0; i < maxAttempts; i++) {
      const angle = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * FOREST_EDGE_FALLOFF;
      const lx = Math.cos(angle) * r * zone.rx;
      const lz = Math.sin(angle) * r * zone.rz;
      const [x, z] = rotateOffset(lx, lz, zone.rotation);
      return [zone.cx + x, zone.cz + z];
    }
    return null;
  }

  for (let i = 0; i < maxAttempts; i++) {
    const along = rangeFrom(rng, -zone.length / 2, zone.length / 2);
    const across = rangeFrom(rng, -zone.width / 2, zone.width / 2);
    const [x, z] = rotateOffset(along, across, zone.rotation);
    return [zone.cx + x, zone.cz + z];
  }

  return null;
}

export function worldToCell(
  cfg: ContinentMapConfig,
  x: number,
  z: number,
): GridCell | null {
  const half = cfg.mapSize / 2;
  const col = Math.floor((x + half) / cfg.cellSize);
  const row = Math.floor((z + half) / cfg.cellSize);
  if (!isBuildableCell(cfg, col, row)) return null;
  return { col, row };
}

export function isFarFromBuildingsWorld(
  cfg: ContinentMapConfig,
  x: number,
  z: number,
  occupancy: GridOccupancy,
  minDist: number,
): boolean {
  const cell = worldToCell(cfg, x, z);
  if (!cell) return false;
  const minCheb = occupancy.minChebyshevToBuilding(cell.col, cell.row);
  return minCheb * cfg.cellSize >= minDist;
}
