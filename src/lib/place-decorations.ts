import {
  decorationsByClusterKind,
  decorationsByZone,
  pickFromPool,
  type DecorationDef,
} from '../config/decoration-catalog';
import {
  allCells,
  GridOccupancy,
  shuffleCells,
  subCellWorldPosition,
  type GridCell,
} from './grid';
import {
  collectForestCells,
  forestZoneWorldArea,
  isFarFromBuildingsWorld,
  pointInForestZone,
  randomPointInZone,
  selectForestZones,
  worldToCell,
  type ForestZone,
} from './forest-zones';
import type { BuildingPlacement } from './layout';
import {
  DECOR_FLOWER_PATCH_DENSITY,
  DECOR_MAX_INSTANCES,
  DECOR_POT_BUILDING_CHANCE,
  DECOR_WILD_MIN_BUILDING_DIST,
  DECOR_WILD_SCATTER_DENSITY,
  decorDensityScale,
  FOREST_GROUND_DENSITY,
  FOREST_MIN_BUILDING_DIST,
  FOREST_TREE_DENSITY,
  type ContinentMapConfig,
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

function largePropMinChebyshev(
  cfg: ContinentMapConfig,
  def: DecorationDef | undefined,
): number {
  const minDist = def?.minBuildingDist ?? DECOR_WILD_MIN_BUILDING_DIST;
  return Math.max(1, Math.ceil(minDist / cfg.cellSize));
}

function isForestTree(def: DecorationDef): boolean {
  return def.id.startsWith('forest-tree-');
}

function splitForestPool(pool: DecorationDef[]): {
  trees: DecorationDef[];
  ground: DecorationDef[];
} {
  const trees: DecorationDef[] = [];
  const ground: DecorationDef[] = [];
  for (const def of pool) {
    if (isForestTree(def)) trees.push(def);
    else ground.push(def);
  }
  return { trees, ground };
}

function isFarFromPoints(
  x: number,
  z: number,
  points: Array<[number, number]>,
  minDist: number,
): boolean {
  for (const [px, pz] of points) {
    if (Math.hypot(x - px, z - pz) < minDist) return false;
  }
  return true;
}

function initOccupancy(
  cfg: ContinentMapConfig,
  buildings: BuildingPlacement[],
): GridOccupancy {
  const occupancy = new GridOccupancy(cfg);
  for (const b of buildings) {
    occupancy.markBuildingCells(b.gridCells, b.note.id);
  }
  return occupancy;
}

function placeBuildingAdjacent(
  cfg: ContinentMapConfig,
  continentId: string,
  buildings: BuildingPlacement[],
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
        const [x, z] = subCellWorldPosition(cfg, cell.col, cell.row, i + 1, rng);

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

function placeForestZoneDecor(
  cfg: ContinentMapConfig,
  rng: () => number,
  zone: ForestZone,
  treePool: DecorationDef[],
  groundPool: DecorationDef[],
  occupancy: GridOccupancy,
  out: DecorationPlacement[],
) {
  if (treePool.length === 0 && groundPool.length === 0) return;

  const area = forestZoneWorldArea(zone);
  const placedPositions: Array<[number, number]> = [];

  if (treePool.length > 0) {
    const treeBudget = Math.max(2, Math.round(area * FOREST_TREE_DENSITY));
    let treesPlaced = 0;
    let attempts = 0;
    const maxAttempts = treeBudget * 14;

    while (treesPlaced < treeBudget && attempts < maxAttempts) {
      attempts++;
      const point = randomPointInZone(rng, zone);
      if (!point) continue;

      const [x, z] = point;
      if (!pointInForestZone(x, z, zone)) continue;
      if (
        !isFarFromBuildingsWorld(cfg, x, z, occupancy, FOREST_MIN_BUILDING_DIST)
      ) {
        continue;
      }
      if (
        !isFarFromPoints(
          x,
          z,
          placedPositions,
          cfg.forestTreeMinSeparation,
        )
      ) {
        continue;
      }

      const decorId = pickFromPool(rng, treePool);
      if (!decorId) break;

      placedPositions.push([x, z]);
      out.push({
        decorId,
        position: [x, 0, z],
        rotation: rng() * Math.PI * 2,
        scale: scaleJitter(rng),
      });
      const cell = worldToCell(cfg, x, z);
      if (cell) occupancy.incrementPlants(cell.col, cell.row);
      treesPlaced++;
    }
  }

  if (groundPool.length === 0) return;

  const groundBudget = Math.max(3, Math.round(area * FOREST_GROUND_DENSITY));
  let groundPlaced = 0;
  let attempts = 0;
  const maxGroundAttempts = groundBudget * 14;

  while (groundPlaced < groundBudget && attempts < maxGroundAttempts) {
    attempts++;
    const point = randomPointInZone(rng, zone);
    if (!point) continue;

    const [x, z] = point;
    if (!pointInForestZone(x, z, zone)) continue;
    if (!isFarFromBuildingsWorld(cfg, x, z, occupancy, FOREST_MIN_BUILDING_DIST)) {
      continue;
    }
    if (
      !isFarFromPoints(
        x,
        z,
        placedPositions,
        cfg.forestGroundTrunkClearance,
      )
    ) {
      continue;
    }

    const decorId = pickFromPool(rng, groundPool);
    if (!decorId) break;

    placedPositions.push([x, z]);
    out.push({
      decorId,
      position: [x, 0, z],
      rotation: rng() * Math.PI * 2,
      scale: scaleJitter(rng),
    });
    const cell = worldToCell(cfg, x, z);
    if (cell) occupancy.incrementPlants(cell.col, cell.row);
    groundPlaced++;
  }
}

function placeForests(
  cfg: ContinentMapConfig,
  rng: () => number,
  gridCells: GridCell[],
  occupancy: GridOccupancy,
  out: DecorationPlacement[],
) {
  const forestPool = decorationsByClusterKind('forest');
  if (forestPool.length === 0) return;

  const { trees: treePool, ground: groundPool } = splitForestPool(forestPool);
  if (treePool.length === 0 && groundPool.length === 0) return;

  const zones = selectForestZones(cfg, rng, occupancy);
  let forestId = 0;

  for (const zone of zones) {
    const forestCells = collectForestCells(
      cfg,
      zone,
      gridCells,
      forestId,
      occupancy,
    );
    if (forestCells.length === 0) {
      forestId++;
      continue;
    }

    placeForestZoneDecor(cfg, rng, zone, treePool, groundPool, occupancy, out);
    forestId++;
  }
}

function placeFlowerPatches(
  cfg: ContinentMapConfig,
  rng: () => number,
  density: number,
  gridCells: GridCell[],
  occupancy: GridOccupancy,
  out: DecorationPlacement[],
) {
  const flowerPool = decorationsByClusterKind('flower');
  if (flowerPool.length === 0) return;

  const target = Math.round(DECOR_FLOWER_PATCH_DENSITY * density);
  const candidates = shuffleCopy(
    gridCells.filter((c) => !occupancy.isOccupiedForWild(c.col, c.row)),
    rng,
  );

  let placed = 0;
  for (const cell of candidates) {
    if (placed >= target) break;

    const count = 4 + Math.floor(rng() * 5);
    for (let i = 0; i < count; i++) {
      const decorId = pickFromPool(rng, flowerPool);
      if (!decorId) continue;
      const [x, z] = subCellWorldPosition(cfg, cell.col, cell.row, i + 2, rng);
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
  cfg: ContinentMapConfig,
  rng: () => number,
  density: number,
  gridCells: GridCell[],
  occupancy: GridOccupancy,
  out: DecorationPlacement[],
) {
  const wildPool = decorationsByZone('wild');
  if (wildPool.length === 0) return;

  const target = Math.round(DECOR_WILD_SCATTER_DENSITY * density);
  const candidates = shuffleCopy(
    gridCells.filter((c) => !occupancy.isOccupiedForWild(c.col, c.row)),
    rng,
  );

  let placed = 0;
  for (const cell of candidates) {
    if (placed >= target) break;

    const decorId = pickFromPool(rng, wildPool);
    if (!decorId) break;

    const def = wildPool.find((d) => d.id === decorId);
    const minCheb = largePropMinChebyshev(cfg, def);
    if (occupancy.minChebyshevToBuilding(cell.col, cell.row) < minCheb) {
      continue;
    }

    const [x, z] = subCellWorldPosition(cfg, cell.col, cell.row, 0, rng);

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
  cfg: ContinentMapConfig;
  buildings: BuildingPlacement[];
}): DecorationPlacement[] {
  const { continentId, cfg, buildings } = input;
  const rng = rngFor(`decor:${continentId}`);
  const out: DecorationPlacement[] = [];
  const occupancy = initOccupancy(cfg, buildings);
  const density = decorDensityScale(cfg.mapSize, cfg.gridAreaScale);
  const gridCells = allCells(cfg);

  placeBuildingAdjacent(cfg, continentId, buildings, occupancy, out);
  placeForests(cfg, rng, gridCells, occupancy, out);
  placeFlowerPatches(cfg, rng, density, gridCells, occupancy, out);
  placeWildScatter(cfg, rng, density, gridCells, occupancy, out);

  if (out.length > DECOR_MAX_INSTANCES) {
    return out.slice(0, DECOR_MAX_INSTANCES);
  }
  return out;
}
