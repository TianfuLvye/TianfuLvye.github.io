import * as THREE from 'three';
import type { TagEdge } from './build-tag-graph';
import {
  cellCenter,
  cellKey,
  isInBounds,
  neighbors4,
  type GridCell,
} from './grid';
import type { ContinentMapConfig } from './map-config';
import type { DoorDirection } from '../config/building-catalog';
import {
  buildingDoorApproaches,
  doorConnectionCell,
  doorFacingMask,
  type BuildingPlacement,
} from './layout';

const ROAD_BASE_Y = 0.04;

export interface RoadDoorTerminal {
  col: number;
  row: number;
  facingMask: number;
}

export interface RoadSegment {
  tag: string;
  sourceId: string;
  targetId: string;
  gridCells: GridCell[];
  waypoints: THREE.Vector3[];
  doorTerminals: RoadDoorTerminal[];
}

interface TrunkPathResult {
  trunkCells: GridCell[];
  sourceDir: DoorDirection;
  targetDir: DoorDirection;
}

function buildingCellSet(buildings: BuildingPlacement[]): Set<string> {
  const set = new Set<string>();
  for (const b of buildings) {
    for (const c of b.gridCells) {
      set.add(cellKey(c.col, c.row));
    }
  }
  return set;
}

function manhattanPath(
  cfg: ContinentMapConfig,
  a: GridCell,
  b: GridCell,
): GridCell[] {
  const path: GridCell[] = [{ col: a.col, row: a.row }];
  let col = a.col;
  let row = a.row;
  while (col !== b.col || row !== b.row) {
    if (col !== b.col) col += col < b.col ? 1 : -1;
    else row += row < b.row ? 1 : -1;
    if (isInBounds(cfg, col, row)) path.push({ col, row });
  }
  return path;
}

function fallbackTrunkPath(
  cfg: ContinentMapConfig,
  source: BuildingPlacement,
  target: BuildingPlacement,
  buildingCells: Set<string>,
): TrunkPathResult | null {
  const sourceDoors = buildingDoorApproaches(cfg, source).filter(
    ({ approach }) => !buildingCells.has(cellKey(approach.col, approach.row)),
  );
  const targetDoors = buildingDoorApproaches(cfg, target).filter(
    ({ approach }) => !buildingCells.has(cellKey(approach.col, approach.row)),
  );
  if (sourceDoors.length === 0 || targetDoors.length === 0) return null;

  let bestSource = sourceDoors[0];
  let bestTarget = targetDoors[0];
  let bestDist = Infinity;

  for (const s of sourceDoors) {
    for (const t of targetDoors) {
      const d =
        Math.abs(s.approach.col - t.approach.col) +
        Math.abs(s.approach.row - t.approach.row);
      if (d < bestDist) {
        bestDist = d;
        bestSource = s;
        bestTarget = t;
      }
    }
  }

  const trunkCells = manhattanPath(
    cfg,
    bestSource.approach,
    bestTarget.approach,
  ).filter((c) => !buildingCells.has(cellKey(c.col, c.row)));

  if (trunkCells.length === 0) return null;

  return {
    trunkCells,
    sourceDir: bestSource.dir,
    targetDir: bestTarget.dir,
  };
}

function findTrunkPath(
  cfg: ContinentMapConfig,
  source: BuildingPlacement,
  target: BuildingPlacement,
  buildings: BuildingPlacement[],
): TrunkPathResult | null {
  const buildingCells = buildingCellSet(buildings);
  const sourceDoors = buildingDoorApproaches(cfg, source).filter(
    ({ approach }) => !buildingCells.has(cellKey(approach.col, approach.row)),
  );
  const targetByKey = new Map<string, DoorDirection>();
  for (const { dir, approach } of buildingDoorApproaches(cfg, target)) {
    if (buildingCells.has(cellKey(approach.col, approach.row))) continue;
    targetByKey.set(cellKey(approach.col, approach.row), dir);
  }

  if (sourceDoors.length === 0 || targetByKey.size === 0) return null;

  const prev = new Map<string, string | null>();
  const queue: Array<{ cell: GridCell; sourceDir: DoorDirection }> = [];

  for (const { dir, approach } of sourceDoors) {
    const k = cellKey(approach.col, approach.row);
    if (!prev.has(k)) {
      prev.set(k, null);
      queue.push({ cell: approach, sourceDir: dir });
    }
  }

  let foundTarget: GridCell | null = null;
  let foundSourceDir: DoorDirection | null = null;
  let foundTargetDir: DoorDirection | null = null;
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { cell: cur, sourceDir } = queue.shift()!;
    const ck = cellKey(cur.col, cur.row);
    if (visited.has(ck)) continue;
    visited.add(ck);

    const targetDir = targetByKey.get(ck);
    if (targetDir !== undefined) {
      foundTarget = cur;
      foundSourceDir = sourceDir;
      foundTargetDir = targetDir;
      break;
    }

    for (const n of neighbors4(cfg, cur.col, cur.row)) {
      const nk = cellKey(n.col, n.row);
      if (visited.has(nk)) continue;
      if (buildingCells.has(nk)) continue;
      if (!isInBounds(cfg, n.col, n.row)) continue;
      if (!prev.has(nk)) {
        prev.set(nk, ck);
        queue.push({ cell: n, sourceDir });
      }
    }
  }

  if (!foundTarget || !foundSourceDir || !foundTargetDir) {
    return fallbackTrunkPath(cfg, source, target, buildingCells);
  }

  const trunkCells: GridCell[] = [];
  let k: string | null = cellKey(foundTarget.col, foundTarget.row);
  while (k) {
    const [col, row] = k.split(',').map(Number);
    trunkCells.unshift({ col, row });
    k = prev.get(k) ?? null;
  }

  return {
    trunkCells,
    sourceDir: foundSourceDir,
    targetDir: foundTargetDir,
  };
}

function cellsToWaypoints(
  cfg: ContinentMapConfig,
  cells: GridCell[],
): THREE.Vector3[] {
  return cells.map(({ col, row }) => {
    const [x, z] = cellCenter(cfg, col, row);
    return new THREE.Vector3(x, ROAD_BASE_Y, z);
  });
}

export function placeRoadSegment(
  cfg: ContinentMapConfig,
  edge: TagEdge,
  buildings: BuildingPlacement[],
): RoadSegment | null {
  const byId = new Map(buildings.map((b) => [b.note.id, b]));
  const source = byId.get(edge.sourceId);
  const target = byId.get(edge.targetId);
  if (!source || !target) return null;

  const trunk = findTrunkPath(cfg, source, target, buildings);
  if (!trunk || trunk.trunkCells.length === 0) return null;

  const sourceDoor = doorConnectionCell(source, trunk.sourceDir);
  const targetDoor = doorConnectionCell(target, trunk.targetDir);
  const gridCells = [sourceDoor, ...trunk.trunkCells, targetDoor];

  return {
    tag: edge.tag,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    gridCells,
    waypoints: cellsToWaypoints(cfg, gridCells),
    doorTerminals: [
      {
        col: sourceDoor.col,
        row: sourceDoor.row,
        facingMask: doorFacingMask(trunk.sourceDir),
      },
      {
        col: targetDoor.col,
        row: targetDoor.row,
        facingMask: doorFacingMask(trunk.targetDir),
      },
    ],
  };
}

export function placeTagRoads(
  cfg: ContinentMapConfig,
  edges: TagEdge[],
  buildings: BuildingPlacement[],
): RoadSegment[] {
  const segments: RoadSegment[] = [];
  for (const edge of edges) {
    const segment = placeRoadSegment(cfg, edge, buildings);
    if (segment) segments.push(segment);
  }
  return segments;
}
