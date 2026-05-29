import {
  buildTagGraph,
  flattenTagEdges,
} from './build-tag-graph';
import {
  gridPositionForBuilding,
  placeBuildings,
  type BuildingPlacement,
} from './layout';
import { placeTagRoads, type RoadSegment } from './place-roads';
import type { NoteData } from './types';

export interface ContinentLayout {
  buildings: BuildingPlacement[];
  tagRoadSegments: RoadSegment[];
}

/** Place buildings and precompute per-tag road segments. */
export function placeContinentLayout(
  notes: NoteData[],
  mapSize: number,
): ContinentLayout {
  const buildings = placeBuildings(notes, mapSize);
  const positions = new Map(
    buildings.map((b) => [b.note.id, gridPositionForBuilding(b)] as const),
  );
  const tagGraph = buildTagGraph(notes, positions);
  const tagRoadSegments = placeTagRoads(flattenTagEdges(tagGraph), buildings);
  return { buildings, tagRoadSegments };
}
