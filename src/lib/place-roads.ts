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

/** Cost to enter a fresh grid cell. */
const STEP_COST = 1;
/** Discounted cost when reusing an existing tag road cell. */
const ROAD_REUSE_COST = 0.2;
/** Extra cost when the path changes direction (encourages straighter routes). */
const TURN_PENALTY = 0.35;

/** Incoming direction index: 0=N, 1=E, 2=S, 3=W; -1 = start (no turn yet). */
const INCOMING_DIRS = [
  { dc: 0, dr: -1 },
  { dc: 1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
] as const;

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

export interface RoadWalkBlockedLayers {
  /** Building footprint cells — always blocked. */
  footprints: Set<string>;
  /** Door tiles and flank cells beside doors (non-footprint). */
  doorZones: Set<string>;
}

interface TrunkPathResult {
  trunkCells: GridCell[];
  sourceDir: DoorDirection;
  targetDir: DoorDirection;
}

interface AStarHeapEntry {
  f: number;
  g: number;
  col: number;
  row: number;
  incomingDir: number;
  sourceDir: DoorDirection;
}

class AStarMinHeap {
  private data: AStarHeapEntry[] = [];

  get size(): number {
    return this.data.length;
  }

  push(entry: AStarHeapEntry): void {
    this.data.push(entry);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): AStarHeapEntry | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent].f <= this.data[i].f) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = i * 2 + 1;
      const right = left + 1;
      if (left < n && this.data[left].f < this.data[smallest].f) {
        smallest = left;
      }
      if (right < n && this.data[right].f < this.data[smallest].f) {
        smallest = right;
      }
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
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

/** Direction index for movement from `from` toward `to`. */
function incomingDirBetween(from: GridCell, to: GridCell): number {
  const dc = to.col - from.col;
  const dr = to.row - from.row;
  if (dc === 0 && dr === -1) return 0;
  if (dc === 1 && dr === 0) return 1;
  if (dc === 0 && dr === 1) return 2;
  if (dc === -1 && dr === 0) return 3;
  return -1;
}

function incomingDirForDoor(dir: DoorDirection): number {
  switch (dir) {
    case 'n':
      return 2;
    case 'e':
      return 3;
    case 's':
      return 0;
    case 'w':
      return 1;
  }
}

function stepCostForCell(
  cellKeyStr: string,
  existingRoadCells: Set<string>,
): number {
  return existingRoadCells.has(cellKeyStr) ? ROAD_REUSE_COST : STEP_COST;
}

function manhattanHeuristic(cell: GridCell, targets: GridCell[]): number {
  let min = Infinity;
  for (const t of targets) {
    const d =
      Math.abs(cell.col - t.col) + Math.abs(cell.row - t.row);
    if (d < min) min = d;
  }
  return min * STEP_COST;
}

function astarStateKey(col: number, row: number, incomingDir: number): string {
  return `${col},${row},${incomingDir}`;
}

/** Cells the trunk may not enter (footprints, door tiles, and flank cells beside doors). */
function trunkWalkBlockedCells(
  cfg: ContinentMapConfig,
  buildings: BuildingPlacement[],
  buildingCells: Set<string>,
): Set<string> {
  const blocked = new Set(buildingCells);

  for (const building of buildings) {
    for (const { door, approach } of buildingDoorApproaches(cfg, building)) {
      blocked.add(cellKey(door.col, door.row));

      for (const n of neighbors4(cfg, door.col, door.row)) {
        const nk = cellKey(n.col, n.row);
        if (buildingCells.has(nk)) continue;
        if (n.col === approach.col && n.row === approach.row) continue;
        blocked.add(nk);
      }
    }
  }

  return blocked;
}

/** Layers for debug overlay (footprints vs door flank zones). */
export function computeRoadWalkBlockedLayers(
  cfg: ContinentMapConfig,
  buildings: BuildingPlacement[],
): RoadWalkBlockedLayers {
  const buildingCells = buildingCellSet(buildings);
  const footprints = new Set(buildingCells);
  const doorZones = new Set<string>();

  for (const building of buildings) {
    for (const { door, approach } of buildingDoorApproaches(cfg, building)) {
      const dk = cellKey(door.col, door.row);
      if (!footprints.has(dk)) doorZones.add(dk);

      for (const n of neighbors4(cfg, door.col, door.row)) {
        const nk = cellKey(n.col, n.row);
        if (footprints.has(nk)) continue;
        if (n.col === approach.col && n.row === approach.row) continue;
        doorZones.add(nk);
      }
    }
  }

  return { footprints, doorZones };
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
  walkBlocked: Set<string>,
): TrunkPathResult | null {
  const sourceDoors = buildingDoorApproaches(cfg, source).filter(
    ({ approach }) => !walkBlocked.has(cellKey(approach.col, approach.row)),
  );
  const targetDoors = buildingDoorApproaches(cfg, target).filter(
    ({ approach }) => !walkBlocked.has(cellKey(approach.col, approach.row)),
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
  ).filter((c) => !walkBlocked.has(cellKey(c.col, c.row)));

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
  existingRoadCells: Set<string>,
): TrunkPathResult | null {
  const buildingCells = buildingCellSet(buildings);
  const walkBlocked = trunkWalkBlockedCells(cfg, buildings, buildingCells);
  const sourceDoors = buildingDoorApproaches(cfg, source).filter(
    ({ approach }) => !walkBlocked.has(cellKey(approach.col, approach.row)),
  );
  const targetByKey = new Map<string, DoorDirection>();
  const targetApproaches: GridCell[] = [];
  for (const { dir, approach } of buildingDoorApproaches(cfg, target)) {
    if (walkBlocked.has(cellKey(approach.col, approach.row))) continue;
    targetByKey.set(cellKey(approach.col, approach.row), dir);
    targetApproaches.push(approach);
  }

  if (sourceDoors.length === 0 || targetByKey.size === 0) return null;

  const gScore = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const heap = new AStarMinHeap();

  for (const { dir, door, approach } of sourceDoors) {
    const incoming = incomingDirBetween(door, approach);
    const sk = astarStateKey(approach.col, approach.row, incoming);
    gScore.set(sk, 0);
    prev.set(sk, null);
    heap.push({
      f: manhattanHeuristic(approach, targetApproaches),
      g: 0,
      col: approach.col,
      row: approach.row,
      incomingDir: incoming,
      sourceDir: dir,
    });
  }

  let bestGoal: {
    g: number;
    cell: GridCell;
    incomingDir: number;
    sourceDir: DoorDirection;
    targetDir: DoorDirection;
  } | null = null;

  while (heap.size > 0) {
    const node = heap.pop()!;
    const ck = cellKey(node.col, node.row);
    const stateKey = astarStateKey(node.col, node.row, node.incomingDir);

    const recordedG = gScore.get(stateKey);
    if (recordedG === undefined || node.g > recordedG) continue;

    if (bestGoal && node.f >= bestGoal.g) break;

    const targetDir = targetByKey.get(ck);
    if (targetDir !== undefined) {
      if (!bestGoal || node.g < bestGoal.g) {
        bestGoal = {
          g: node.g,
          cell: { col: node.col, row: node.row },
          incomingDir: node.incomingDir,
          sourceDir: node.sourceDir,
          targetDir,
        };
      }
      continue;
    }

    for (let dirIdx = 0; dirIdx < INCOMING_DIRS.length; dirIdx++) {
      const { dc, dr } = INCOMING_DIRS[dirIdx];
      const nc = node.col + dc;
      const nr = node.row + dr;
      if (!isInBounds(cfg, nc, nr)) continue;

      const nk = cellKey(nc, nr);
      if (walkBlocked.has(nk)) continue;

      const turnCost =
        node.incomingDir >= 0 && dirIdx !== node.incomingDir
          ? TURN_PENALTY
          : 0;
      const tentativeG =
        node.g + stepCostForCell(nk, existingRoadCells) + turnCost;
      const nextState = astarStateKey(nc, nr, dirIdx);

      const prevG = gScore.get(nextState);
      if (prevG !== undefined && tentativeG >= prevG) continue;

      gScore.set(nextState, tentativeG);
      prev.set(nextState, stateKey);
      heap.push({
        f: tentativeG + manhattanHeuristic({ col: nc, row: nr }, targetApproaches),
        g: tentativeG,
        col: nc,
        row: nr,
        incomingDir: dirIdx,
        sourceDir: node.sourceDir,
      });
    }
  }

  if (!bestGoal) {
    return fallbackTrunkPath(cfg, source, target, buildingCells, walkBlocked);
  }

  const trunkCells: GridCell[] = [];
  let k: string | null = astarStateKey(
    bestGoal.cell.col,
    bestGoal.cell.row,
    bestGoal.incomingDir,
  );
  while (k) {
    const [col, row] = k.split(',').slice(0, 2).map(Number);
    trunkCells.unshift({ col, row });
    k = prev.get(k) ?? null;
  }

  return {
    trunkCells,
    sourceDir: bestGoal.sourceDir,
    targetDir: bestGoal.targetDir,
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
  existingRoadCells: Set<string> = new Set(),
): RoadSegment | null {
  const byId = new Map(buildings.map((b) => [b.note.id, b]));
  const source = byId.get(edge.sourceId);
  const target = byId.get(edge.targetId);
  if (!source || !target) return null;

  const trunk = findTrunkPath(
    cfg,
    source,
    target,
    buildings,
    existingRoadCells,
  );
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

/** Place roads edge-by-edge; later edges within a tag prefer reusing existing cells. */
export function placeTagRoads(
  cfg: ContinentMapConfig,
  edges: TagEdge[],
  buildings: BuildingPlacement[],
): RoadSegment[] {
  const existingByTag = new Map<string, Set<string>>();
  const segments: RoadSegment[] = [];

  for (const edge of edges) {
    let existing = existingByTag.get(edge.tag);
    if (!existing) {
      existing = new Set<string>();
      existingByTag.set(edge.tag, existing);
    }

    const segment = placeRoadSegment(cfg, edge, buildings, existing);
    if (!segment) continue;

    segments.push(segment);
    for (const cell of segment.gridCells) {
      existing.add(cellKey(cell.col, cell.row));
    }
  }

  return segments;
}
