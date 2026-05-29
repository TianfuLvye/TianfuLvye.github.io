import { placeBuildings, type BuildingPlacement } from './layout';
import type { NoteData } from './types';

export interface ContinentLayout {
  buildings: BuildingPlacement[];
}

/** Place buildings on the continent grid. */
export function placeContinentLayout(
  notes: NoteData[],
  mapSize: number,
): ContinentLayout {
  const buildings = placeBuildings(notes, mapSize);
  return { buildings };
}
