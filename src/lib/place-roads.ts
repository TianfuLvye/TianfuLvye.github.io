import * as THREE from 'three';
import type { TagEdge } from './build-tag-graph';
import {
  cellCenter,
  cellKey,
  isInBounds,
  neighbors4,
  type GridCell,
} from './grid';
import type { BuildingPlacement } from './layout';

const ROAD_BASE_Y = 0.04;

export interface RoadSegment {
  tag: string;
  sourceId: string;
  targetId: string;
  gridCells: GridCell[];
  waypoints: THREE.Vector3[];
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

function perimeterCells(building: BuildingPlacement): GridCell[] {
  const interior = new Set(
    building.gridCells.map((c) => cellKey(c.col, c.row)),
  );
  const perim = new Map<string, GridCell>();
  for (const c of building.gridCells) {
    for (const n of neighbors4(c.col, c.row)) {
      const k = cellKey(n.col, n.row);
      if (!interior.has(k)) perim.set(k, n);
    }
  }
  return [...perim.values()].sort((a, b) =>
    a.col !== b.col ? a.col - b.col : a.row - b.row,
  );
}

function manhattanPath(a: GridCell, b: GridCell): GridCell[] {
  const path: GridCell[] = [{ col: a.col, row: a.row }];
  let col = a.col;
  let row = a.row;
  while (col !== b.col || row !== b.row) {
    if (col !== b.col) col += col < b.col ? 1 : -1;
    else row += row < b.row ? 1 : -1;
    if (isInBounds(col, row)) path.push({ col, row });
  }
  return path;
}

function fallbackDirectPath(
  source: BuildingPlacement,
  target: BuildingPlacement,
  buildingCells: Set<string>,
): GridCell[] {
  const sources = perimeterCells(source);
  const targets = perimeterCells(target);
  if (sources.length === 0 || targets.length === 0) return [];

  let bestA = sources[0];
  let bestB = targets[0];
  let bestDist = Infinity;
  for (const a of sources) {
    for (const b of targets) {
      const d = Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
      if (d < bestDist) {
        bestDist = d;
        bestA = a;
        bestB = b;
      }
    }
  }

  const path = manhattanPath(bestA, bestB);
  return path.filter((c) => !buildingCells.has(cellKey(c.col, c.row)));
}

function findRoadPath(
  source: BuildingPlacement,
  target: BuildingPlacement,
  buildings: BuildingPlacement[],
): GridCell[] {
  const buildingCells = buildingCellSet(buildings);
  const sources = perimeterCells(source);
  const targetKeys = new Set(
    perimeterCells(target).map((c) => cellKey(c.col, c.row)),
  );

  if (sources.length === 0 || targetKeys.size === 0) return [];

  const prev = new Map<string, string | null>();
  const queue: GridCell[] = [];

  for (const s of sources) {
    const k = cellKey(s.col, s.row);
    if (!prev.has(k)) {
      prev.set(k, null);
      queue.push(s);
    }
  }

  let foundTarget: GridCell | null = null;
  const visited = new Set<string>();

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const ck = cellKey(cur.col, cur.row);
    if (visited.has(ck)) continue;
    visited.add(ck);

    if (targetKeys.has(ck)) {
      foundTarget = cur;
      break;
    }

    for (const n of neighbors4(cur.col, cur.row)) {
      const nk = cellKey(n.col, n.row);
      if (visited.has(nk)) continue;
      if (buildingCells.has(nk)) continue;
      if (!isInBounds(n.col, n.row)) continue;
      if (!prev.has(nk)) {
        prev.set(nk, ck);
        queue.push(n);
      }
    }
  }

  if (!foundTarget) {
    return fallbackDirectPath(source, target, buildingCells);
  }

  const path: GridCell[] = [];
  let k: string | null = cellKey(foundTarget.col, foundTarget.row);
  while (k) {
    const [col, row] = k.split(',').map(Number);
    path.unshift({ col, row });
    k = prev.get(k) ?? null;
  }
  return path;
}

function cellsToWaypoints(cells: GridCell[]): THREE.Vector3[] {
  return cells.map(({ col, row }) => {
    const [x, z] = cellCenter(col, row);
    return new THREE.Vector3(x, ROAD_BASE_Y, z);
  });
}

export function placeRoadSegment(
  edge: TagEdge,
  buildings: BuildingPlacement[],
): RoadSegment | null {
  const byId = new Map(buildings.map((b) => [b.note.id, b]));
  const source = byId.get(edge.sourceId);
  const target = byId.get(edge.targetId);
  if (!source || !target) return null;

  const gridCells = findRoadPath(source, target, buildings);
  if (gridCells.length === 0) return null;

  return {
    tag: edge.tag,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    gridCells,
    waypoints: cellsToWaypoints(gridCells),
  };
}

export function placeTagRoads(
  edges: TagEdge[],
  buildings: BuildingPlacement[],
): RoadSegment[] {
  const segments: RoadSegment[] = [];
  for (const edge of edges) {
    const segment = placeRoadSegment(edge, buildings);
    if (segment) segments.push(segment);
  }
  return segments;
}
