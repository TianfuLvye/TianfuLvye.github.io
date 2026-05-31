import {
  buildTagGraph,
  flattenTagEdges,
} from './build-tag-graph';
import { gridPositionForBuilding, type BuildingPlacement } from './building-placement';
import { placeBuildings } from './place-buildings';
import type { ContinentMapConfig } from './map-config';
import { placeTagRoads, type RoadSegment } from './place-roads';
import type { NoteData } from './types';

export interface ContinentLayout {
  buildings: BuildingPlacement[];
  tagRoadSegments: RoadSegment[];
}

/** Place buildings and precompute per-tag road segments. */
export function placeContinentLayout(
  notes: NoteData[],
  cfg: ContinentMapConfig,
): ContinentLayout {
  const buildings = placeBuildings(notes, cfg);
  const positions = new Map(
    buildings.map((b) => [b.note.id, gridPositionForBuilding(b)] as const),
  );
  const tagGraph = buildTagGraph(notes, positions);
  const tagRoadSegments = placeTagRoads(cfg, flattenTagEdges(tagGraph), buildings);
  return { buildings, tagRoadSegments };
}
