import * as THREE from 'three';
import {
  cellCenter,
  cellKey,
  isInBounds,
  neighbors4,
  type GridCell,
} from './grid';
import type { BuildingPlacement } from './layout';

const BRIDGE_BASE_Y = 0.06;
import type { TagBridge } from './types';

function bridgeKeyFor(bridge: TagBridge): string {
  return `${bridge.sourceId}:${bridge.targetId}`;
}

export interface BridgePlacement {
  bridge: TagBridge;
  /** Path cells between building perimeters (excludes building interiors). */
  gridCells: GridCell[];
  /** World positions at each path cell center. */
  waypoints: THREE.Vector3[];
}

export interface BridgeJunction {
  col: number;
  row: number;
  position: [number, number, number];
  bridgeKeys: string[];
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
      const d =
        Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
      if (d < bestDist) {
        bestDist = d;
        bestA = a;
        bestB = b;
      }
    }
  }

  const path = manhattanPath(bestA, bestB);
  console.warn(
    `[placeBridges] no BFS path ${source.note.id} → ${target.note.id}; using Manhattan fallback`,
  );
  return path.filter((c) => !buildingCells.has(cellKey(c.col, c.row)));
}

function findBridgePath(
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
    return new THREE.Vector3(x, BRIDGE_BASE_Y, z);
  });
}

export function placeBridges(
  tagBridges: TagBridge[],
  buildings: BuildingPlacement[],
): BridgePlacement[] {
  const byId = new Map(buildings.map((b) => [b.note.id, b]));
  const placements: BridgePlacement[] = [];

  for (const bridge of tagBridges) {
    const a = byId.get(bridge.sourceId);
    const b = byId.get(bridge.targetId);
    if (!a || !b) continue;

    const gridCells = findBridgePath(a, b, buildings);
    if (gridCells.length === 0) continue;

    placements.push({
      bridge,
      gridCells,
      waypoints: cellsToWaypoints(gridCells),
    });
  }

  return placements;
}

export function detectBridgeJunctions(
  placements: BridgePlacement[],
): BridgeJunction[] {
  const byCell = new Map<string, Set<string>>();

  for (const p of placements) {
    const key = bridgeKeyFor(p.bridge);
    for (const { col, row } of p.gridCells) {
      const k = cellKey(col, row);
      if (!byCell.has(k)) byCell.set(k, new Set());
      byCell.get(k)!.add(key);
    }
  }

  const junctions: BridgeJunction[] = [];
  for (const [k, keys] of byCell) {
    if (keys.size < 2) continue;
    const [col, row] = k.split(',').map(Number);
    const [x, z] = cellCenter(col, row);
    junctions.push({
      col,
      row,
      position: [x, BRIDGE_BASE_Y, z],
      bridgeKeys: [...keys].sort(),
    });
  }

  junctions.sort((a, b) =>
    a.col !== b.col ? a.col - b.col : a.row - b.row,
  );
  return junctions;
}

/** Bridge corridor cells excluding building interiors — for building placement blocking. */
export function bridgeBlockedCells(
  placements: BridgePlacement[],
  buildings: BuildingPlacement[],
): Set<string> {
  const buildingCells = buildingCellSet(buildings);
  const blocked = new Set<string>();
  for (const p of placements) {
    for (const c of p.gridCells) {
      const k = cellKey(c.col, c.row);
      if (!buildingCells.has(k)) blocked.add(k);
    }
  }
  return blocked;
}
