import { GRID_BRIDGE_MAX_ITERATIONS } from './map-config';
import {
  gridPositionForBuilding,
  placeBuildings,
  type BuildingPlacement,
} from './layout';
import {
  bridgeBlockedCells,
  detectBridgeJunctions,
  placeBridges,
  type BridgeJunction,
  type BridgePlacement,
} from './place-bridges';
import { buildTagBridges } from './tag-bridges';
import type { NoteData, TagBridge } from './types';

export interface ContinentLayout {
  buildings: BuildingPlacement[];
  bridgePlacements: BridgePlacement[];
  bridgeJunctions: BridgeJunction[];
  tagBridges: TagBridge[];
}

function buildingAnchorsSignature(buildings: BuildingPlacement[]): string {
  return buildings
    .map((b) => `${b.note.id}:${b.gridCol},${b.gridRow}`)
    .sort()
    .join('|');
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const k of a) {
    if (!b.has(k)) return false;
  }
  return true;
}

/**
 * Place buildings and grid-routed bridges iteratively until anchors and
 * bridge corridor cells stabilize.
 */
export function placeContinentLayout(
  notes: NoteData[],
  mapSize: number,
): ContinentLayout {
  let blockedCells = new Set<string>();
  let buildings: BuildingPlacement[] = [];
  let bridgePlacements: BridgePlacement[] = [];
  let tagBridges: TagBridge[] = [];
  let prevSignature = '';
  let prevBlocked = new Set<string>();

  for (let iter = 0; iter < GRID_BRIDGE_MAX_ITERATIONS; iter++) {
    buildings = placeBuildings(notes, mapSize, { blockedCells });

    const positions = new Map(
      buildings.map((p) => [p.note.id, gridPositionForBuilding(p)]),
    );
    tagBridges = buildTagBridges(notes, positions);
    bridgePlacements = placeBridges(tagBridges, buildings);

    const nextBlocked = bridgeBlockedCells(bridgePlacements, buildings);
    const signature = buildingAnchorsSignature(buildings);

    if (
      signature === prevSignature &&
      setsEqual(nextBlocked, prevBlocked)
    ) {
      break;
    }

    prevSignature = signature;
    prevBlocked = nextBlocked;
    blockedCells = nextBlocked;
  }

  const bridgeJunctions = detectBridgeJunctions(bridgePlacements);

  return {
    buildings,
    bridgePlacements,
    bridgeJunctions,
    tagBridges,
  };
}
