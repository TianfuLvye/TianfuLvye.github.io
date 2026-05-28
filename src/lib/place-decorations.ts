import { getBuilding } from '../config/building-catalog';
import {
  decorationsByClusterKind,
  decorationsByZone,
  pickFromPool,
  type DecorationDef,
} from '../config/decoration-catalog';
import { layoutFenceAroundBuilding } from './decoration-fence';
import { isNearBridgeCorridor } from './plank-bridge';
import type { BuildingPlacement } from './layout';
import {
  BUILDING_FOOTPRINT_SCALE,
  DECOR_CLUSTER_MIN_SPACING,
  DECOR_FENCE_BUILDING_CHANCE,
  DECOR_FLOWER_PATCH_DENSITY,
  DECOR_TREE_GROVE_DENSITY,
  DECOR_WILD_MIN_BUILDING_DIST,
  DECOR_WILD_SCATTER_DENSITY,
} from './map-config';
import { rngFor, rangeFrom } from './random';

export interface DecorationPlacement {
  decorId: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

const BUILDING_POT_MIN_DIST = 0.4;
const SCALE_JITTER_MIN = 0.85;
const SCALE_JITTER_MAX = 1.15;

export function buildingRadius(building: BuildingPlacement): number {
  const def = getBuilding(building.modelId);
  const footprint = (def?.footprint ?? 1) * BUILDING_FOOTPRINT_SCALE;
  return footprint * building.scale[0] * 0.55;
}

function distanceToNearestBuilding(
  x: number,
  z: number,
  buildings: BuildingPlacement[],
): number {
  if (buildings.length === 0) return Infinity;
  let min = Infinity;
  for (const b of buildings) {
    const d = Math.hypot(b.position[0] - x, b.position[2] - z);
    if (d < min) min = d;
  }
  return min;
}

function distanceToNearestClusterCenter(
  x: number,
  z: number,
  centers: Array<[number, number]>,
): number {
  if (centers.length === 0) return Infinity;
  let min = Infinity;
  for (const [cx, cz] of centers) {
    const d = Math.hypot(cx - x, cz - z);
    if (d < min) min = d;
  }
  return min;
}

function scaleJitter(rng: () => number): number {
  return rangeFrom(rng, SCALE_JITTER_MIN, SCALE_JITTER_MAX);
}

function isValidWildPoint(
  x: number,
  z: number,
  mapSize: number,
  minBuildingDist: number,
  buildings: BuildingPlacement[],
  bridgeCorridor: Array<[number, number]>,
  clusterCenters: Array<[number, number]>,
): boolean {
  const half = mapSize / 2;
  const margin = 0.5;
  if (
    x < -half + margin ||
    x > half - margin ||
    z < -half + margin ||
    z > half - margin
  ) {
    return false;
  }
  if (distanceToNearestBuilding(x, z, buildings) < minBuildingDist) {
    return false;
  }
  if (isNearBridgeCorridor(x, z, bridgeCorridor)) return false;
  if (
    distanceToNearestClusterCenter(x, z, clusterCenters) <
    DECOR_CLUSTER_MIN_SPACING
  ) {
    return false;
  }
  return true;
}

function sampleRingPoint(
  rng: () => number,
  cx: number,
  cz: number,
  minDist: number,
  maxDist: number,
): [number, number] {
  const angle = rng() * Math.PI * 2;
  const dist = rangeFrom(rng, minDist, maxDist);
  return [cx + Math.sin(angle) * dist, cz + Math.cos(angle) * dist];
}

function rotationToward(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

function placeBuildingAdjacent(
  continentId: string,
  buildings: BuildingPlacement[],
  bridgeCorridor: Array<[number, number]>,
  out: DecorationPlacement[],
) {
  const potPool = decorationsByZone('building').filter((d) => d.id !== 'fence');

  for (const building of buildings) {
    const rng = rngFor(`decor:${continentId}:${building.note.id}`);
    const bx = building.position[0];
    const bz = building.position[2];
    const radius = buildingRadius(building);

    for (const def of potPool) {
      const chance = def.buildingChance ?? 0;
      if (rng() >= chance) continue;

      const [minCount, maxCount] = def.perBuildingCount ?? [1, 1];
      const count =
        minCount +
        Math.floor(rng() * (maxCount - minCount + 1));
      const maxDist = def.maxBuildingDist ?? 1.6;
      const minDist = Math.max(BUILDING_POT_MIN_DIST, radius * 0.35);

      for (let i = 0; i < count; i++) {
        for (let attempt = 0; attempt < 24; attempt++) {
          const [x, z] = sampleRingPoint(rng, bx, bz, minDist, maxDist);
          if (isNearBridgeCorridor(x, z, bridgeCorridor)) continue;
          out.push({
            decorId: def.id,
            position: [x, 0, z],
            rotation: rotationToward(x, z, bx, bz) + rangeFrom(rng, -0.3, 0.3),
            scale: scaleJitter(rng),
          });
          break;
        }
      }
    }

    if (rng() < DECOR_FENCE_BUILDING_CHANCE) {
      const fenceItems = layoutFenceAroundBuilding(
        bx,
        bz,
        building.rotation,
        radius,
        rng,
      );
      out.push(...fenceItems);
    }
  }
}

function placeCluster(
  rng: () => number,
  cx: number,
  cz: number,
  pool: DecorationDef[],
  countMin: number,
  countMax: number,
  radiusMin: number,
  radiusMax: number,
): DecorationPlacement[] {
  const count =
    countMin + Math.floor(rng() * (countMax - countMin + 1));
  const items: DecorationPlacement[] = [];

  for (let i = 0; i < count; i++) {
    const decorId = pickFromPool(rng, pool);
    if (!decorId) continue;
    const angle = rng() * Math.PI * 2;
    const dist = rangeFrom(rng, 0, rangeFrom(rng, radiusMin, radiusMax));
    const x = cx + Math.sin(angle) * dist;
    const z = cz + Math.cos(angle) * dist;
    items.push({
      decorId,
      position: [x, 0, z],
      rotation: rng() * Math.PI * 2,
      scale: scaleJitter(rng),
    });
  }

  return items;
}

function placeWildClusters(
  rng: () => number,
  mapSize: number,
  buildings: BuildingPlacement[],
  bridgeCorridor: Array<[number, number]>,
  out: DecorationPlacement[],
): Array<[number, number]> {
  const half = mapSize / 2;
  const clusterCenters: Array<[number, number]> = [];
  const treePool = decorationsByClusterKind('tree');
  const flowerPool = decorationsByClusterKind('flower');

  const treeTarget = Math.round(
    DECOR_TREE_GROVE_DENSITY * (mapSize / 18),
  );
  const flowerTarget = Math.round(
    DECOR_FLOWER_PATCH_DENSITY * (mapSize / 18),
  );

  const tryPlaceCluster = (
    target: number,
    pool: DecorationDef[],
    countMin: number,
    countMax: number,
    radiusMin: number,
    radiusMax: number,
  ) => {
    let placed = 0;
    let attempts = 0;
    const maxAttempts = target * 40;

    while (placed < target && attempts < maxAttempts) {
      attempts++;
      const x = rangeFrom(rng, -half + 1, half - 1);
      const z = rangeFrom(rng, -half + 1, half - 1);
      if (
        !isValidWildPoint(
          x,
          z,
          mapSize,
          DECOR_WILD_MIN_BUILDING_DIST,
          buildings,
          bridgeCorridor,
          clusterCenters,
        )
      ) {
        continue;
      }
      if (pool.length === 0) break;

      clusterCenters.push([x, z]);
      out.push(
        ...placeCluster(
          rng,
          x,
          z,
          pool,
          countMin,
          countMax,
          radiusMin,
          radiusMax,
        ),
      );
      placed++;
    }
  };

  tryPlaceCluster(treeTarget, treePool, 3, 6, 1.0, 2.2);
  tryPlaceCluster(flowerTarget, flowerPool, 4, 8, 0.6, 1.4);

  return clusterCenters;
}

function placeWildScatter(
  rng: () => number,
  mapSize: number,
  buildings: BuildingPlacement[],
  bridgeCorridor: Array<[number, number]>,
  clusterCenters: Array<[number, number]>,
  out: DecorationPlacement[],
) {
  const half = mapSize / 2;
  const wildPool = decorationsByZone('wild');
  const target = Math.round(DECOR_WILD_SCATTER_DENSITY * (mapSize / 18));
  let placed = 0;
  let attempts = 0;
  const maxAttempts = target * 12;

  while (placed < target && attempts < maxAttempts) {
    attempts++;
    const decorId = pickFromPool(rng, wildPool);
    if (!decorId) break;

    const def = wildPool.find((d) => d.id === decorId);
    const minDist =
      def?.minBuildingDist ?? DECOR_WILD_MIN_BUILDING_DIST;

    const x = rangeFrom(rng, -half + 0.5, half - 0.5);
    const z = rangeFrom(rng, -half + 0.5, half - 0.5);

    if (
      !isValidWildPoint(
        x,
        z,
        mapSize,
        minDist,
        buildings,
        bridgeCorridor,
        clusterCenters,
      )
    ) {
      continue;
    }

    out.push({
      decorId,
      position: [x, 0, z],
      rotation: rng() * Math.PI * 2,
      scale: scaleJitter(rng),
    });
    placed++;
  }
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

  placeBuildingAdjacent(continentId, buildings, bridgeCorridor, out);

  const clusterCenters = placeWildClusters(
    rng,
    mapSize,
    buildings,
    bridgeCorridor,
    out,
  );

  placeWildScatter(
    rng,
    mapSize,
    buildings,
    bridgeCorridor,
    clusterCenters,
    out,
  );

  return out;
}
