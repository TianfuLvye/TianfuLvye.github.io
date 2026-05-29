import {
  decorationsByClusterKind,
  decorationsByZone,
  pickFromPool,
  type DecorationDef,
} from '../config/decoration-catalog';
import {
  allCells,
  cellCenter,
  GridOccupancy,
  neighbors4,
  shuffleCells,
  subCellWorldPosition,
  type GridCell,
} from './grid';
import { isNearBridgeCorridor } from './plank-bridge';
import type { BuildingPlacement } from './layout';
import {
  DECOR_FLOWER_PATCH_DENSITY,
  DECOR_LARGE_MIN_BUILDING_DIST,
  DECOR_POT_BUILDING_CHANCE,
  DECOR_WILD_MIN_BUILDING_DIST,
  DECOR_WILD_SCATTER_DENSITY,
  GRID_FOREST_COUNT,
  GRID_FOREST_MAX_CELLS,
  GRID_FOREST_MIN_CELLS,
  GRID_FOREST_MIN_SPACING,
} from './map-config';
import { rngFor, rangeFrom } from './random';

export interface DecorationPlacement {
  decorId: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

const SCALE_JITTER_MIN = 0.85;
const SCALE_JITTER_MAX = 1.15;

function scaleJitter(rng: () => number): number {
  return rangeFrom(rng, SCALE_JITTER_MIN, SCALE_JITTER_MAX);
}

function rotationToward(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

function isBridgeClear(
  x: number,
  z: number,
  bridgeCorridor: Array<[number, number]>,
): boolean {
  return !isNearBridgeCorridor(x, z, bridgeCorridor);
}

function isCellBridgeClear(
  col: number,
  row: number,
  bridgeCorridor: Array<[number, number]>,
): boolean {
  const [cx, cz] = cellCenter(col, row);
  if (!isBridgeClear(cx, cz, bridgeCorridor)) return false;
  return true;
}

function largePropMinChebyshev(def: DecorationDef | undefined): number {
  const minDist = def?.minBuildingDist ?? DECOR_WILD_MIN_BUILDING_DIST;
  return minDist >= DECOR_LARGE_MIN_BUILDING_DIST ? 2 : 1;
}

function initOccupancy(buildings: BuildingPlacement[]): GridOccupancy {
  const occupancy = new GridOccupancy();
  for (const b of buildings) {
    occupancy.markBuildingCells(b.gridCells, b.note.id);
  }
  return occupancy;
}

function placeBuildingAdjacent(
  continentId: string,
  buildings: BuildingPlacement[],
  bridgeCorridor: Array<[number, number]>,
  occupancy: GridOccupancy,
  out: DecorationPlacement[],
) {
  const potPool = decorationsByZone('building');

  for (const building of buildings) {
    const rng = rngFor(`decor:${continentId}:${building.note.id}`);
    const bx = building.position[0];
    const bz = building.position[2];

    for (const def of potPool) {
      const chance = def.buildingChance ?? DECOR_POT_BUILDING_CHANCE;
      if (rng() >= chance) continue;

      const [minCount, maxCount] = def.perBuildingCount ?? [0, 1];
      const count =
        minCount + Math.floor(rng() * (maxCount - minCount + 1));

      for (let i = 0; i < count; i++) {
        const cell = building.gridCells[i % building.gridCells.length];
        const [x, z] = subCellWorldPosition(cell.col, cell.row, i + 1, rng);
        if (!isBridgeClear(x, z, bridgeCorridor)) continue;

        out.push({
          decorId: def.id,
          position: [x, 0, z],
          rotation: rotationToward(x, z, bx, bz) + rangeFrom(rng, -0.3, 0.3),
          scale: scaleJitter(rng),
        });
        occupancy.incrementPlants(cell.col, cell.row);
      }
    }
  }
}

function growForest(
  rng: () => number,
  start: GridCell,
  targetSize: number,
  forestId: number,
  occupancy: GridOccupancy,
  bridgeCorridor: Array<[number, number]>,
): GridCell[] {
  const cells: GridCell[] = [start];
  occupancy.setForest(start.col, start.row, forestId);

  while (cells.length < targetSize) {
    const frontier: GridCell[] = [];
    const seen = new Set<string>();

    for (const c of cells) {
      for (const n of neighbors4(c.col, c.row)) {
        const k = `${n.col},${n.row}`;
        if (seen.has(k)) continue;
        seen.add(k);
        if (occupancy.hasBuilding(n.col, n.row)) continue;
        if (occupancy.hasForest(n.col, n.row)) continue;
        if (!isCellBridgeClear(n.col, n.row, bridgeCorridor)) continue;
        frontier.push(n);
      }
    }

    if (frontier.length === 0) break;

    const pick = frontier[Math.floor(rng() * frontier.length)];
    cells.push(pick);
    occupancy.setForest(pick.col, pick.row, forestId);
  }

  return cells;
}

function placeForests(
  rng: () => number,
  mapSize: number,
  occupancy: GridOccupancy,
  bridgeCorridor: Array<[number, number]>,
  out: DecorationPlacement[],
) {
  const treePool = decorationsByClusterKind('tree');
  if (treePool.length === 0) return;

  const target = Math.round(GRID_FOREST_COUNT * (mapSize / 18));
  const candidates = shuffleCopy(
    allCells().filter(
      (c) =>
        !occupancy.hasBuilding(c.col, c.row) &&
        !occupancy.hasForest(c.col, c.row) &&
        isCellBridgeClear(c.col, c.row, bridgeCorridor),
    ),
    rng,
  );

  let forestId = 0;
  let placed = 0;

  for (const start of candidates) {
    if (placed >= target) break;
    if (
      occupancy.minChebyshevToForest(start.col, start.row) <
      GRID_FOREST_MIN_SPACING
    ) {
      continue;
    }

    const size =
      GRID_FOREST_MIN_CELLS +
      Math.floor(
        rng() * (GRID_FOREST_MAX_CELLS - GRID_FOREST_MIN_CELLS + 1),
      );
    const forestCells = growForest(
      rng,
      start,
      size,
      forestId,
      occupancy,
      bridgeCorridor,
    );

    for (const cell of forestCells) {
      const treeCount = 2 + Math.floor(rng() * 3);
      for (let t = 0; t < treeCount; t++) {
        const decorId = pickFromPool(rng, treePool);
        if (!decorId) continue;
        const [x, z] = subCellWorldPosition(cell.col, cell.row, t, rng);
        if (!isBridgeClear(x, z, bridgeCorridor)) continue;
        out.push({
          decorId,
          position: [x, 0, z],
          rotation: rng() * Math.PI * 2,
          scale: scaleJitter(rng),
        });
        occupancy.incrementPlants(cell.col, cell.row);
      }
    }

    forestId++;
    placed++;
  }
}

function placeFlowerPatches(
  rng: () => number,
  mapSize: number,
  occupancy: GridOccupancy,
  bridgeCorridor: Array<[number, number]>,
  out: DecorationPlacement[],
) {
  const flowerPool = decorationsByClusterKind('flower');
  if (flowerPool.length === 0) return;

  const target = Math.round(DECOR_FLOWER_PATCH_DENSITY * (mapSize / 18));
  const candidates = shuffleCopy(
    allCells().filter(
      (c) =>
        !occupancy.isOccupiedForWild(c.col, c.row) &&
        isCellBridgeClear(c.col, c.row, bridgeCorridor),
    ),
    rng,
  );

  let placed = 0;
  for (const cell of candidates) {
    if (placed >= target) break;

    const count = 4 + Math.floor(rng() * 5);
    for (let i = 0; i < count; i++) {
      const decorId = pickFromPool(rng, flowerPool);
      if (!decorId) continue;
      const [x, z] = subCellWorldPosition(cell.col, cell.row, i + 2, rng);
      if (!isBridgeClear(x, z, bridgeCorridor)) continue;
      out.push({
        decorId,
        position: [x, 0, z],
        rotation: rng() * Math.PI * 2,
        scale: scaleJitter(rng),
      });
    }
    occupancy.setFlowerPatch(cell.col, cell.row);
    placed++;
  }
}

function placeWildScatter(
  rng: () => number,
  mapSize: number,
  occupancy: GridOccupancy,
  bridgeCorridor: Array<[number, number]>,
  out: DecorationPlacement[],
) {
  const wildPool = decorationsByZone('wild');
  if (wildPool.length === 0) return;

  const target = Math.round(DECOR_WILD_SCATTER_DENSITY * (mapSize / 18));
  const candidates = shuffleCopy(
    allCells().filter(
      (c) =>
        !occupancy.isOccupiedForWild(c.col, c.row) &&
        isCellBridgeClear(c.col, c.row, bridgeCorridor),
    ),
    rng,
  );

  let placed = 0;
  for (const cell of candidates) {
    if (placed >= target) break;

    const decorId = pickFromPool(rng, wildPool);
    if (!decorId) break;

    const def = wildPool.find((d) => d.id === decorId);
    const minCheb = largePropMinChebyshev(def);
    if (occupancy.minChebyshevToBuilding(cell.col, cell.row) < minCheb) {
      continue;
    }

    const [x, z] = subCellWorldPosition(cell.col, cell.row, 0, rng);
    if (!isBridgeClear(x, z, bridgeCorridor)) continue;

    out.push({
      decorId,
      position: [x, 0, z],
      rotation: rng() * Math.PI * 2,
      scale: scaleJitter(rng),
    });
    placed++;
  }
}

function shuffleCopy<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  shuffleCells(copy, rng);
  return copy;
}

export function placeDecorations(input: {
  continentId: string;
  mapSize: number;
  buildings: BuildingPlacement[];
  bridgeCorridor: Array<[number, number]>;
}): DecorationPlacement[] {
  const { continentId, mapSize, buildings, bridgeCorridor } = input;
  const rng = rngFor(`decor:${continentId}`);
  const out: DecorationPlacement[] = [];
  const occupancy = initOccupancy(buildings);

  placeBuildingAdjacent(continentId, buildings, bridgeCorridor, occupancy, out);
  placeForests(rng, mapSize, occupancy, bridgeCorridor, out);
  placeFlowerPatches(rng, mapSize, occupancy, bridgeCorridor, out);
  placeWildScatter(rng, mapSize, occupancy, bridgeCorridor, out);

  return out;
}
