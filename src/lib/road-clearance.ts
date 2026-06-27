import { NEIGHBOR4_OFFSETS } from './direction';
import { cellKey, parseCellKey } from './grid';

/** Road cells plus 4-neighbor ring — hide decorations that overlap the path. */
export function roadDecorClearanceCells(roadCellKeys: Iterable<string>): Set<string> {
  const road = new Set(roadCellKeys);
  const clearance = new Set(road);

  for (const key of road) {
    const { col, row } = parseCellKey(key);
    for (const { dc, dr } of NEIGHBOR4_OFFSETS) {
      clearance.add(cellKey(col + dc, row + dr));
    }
  }

  return clearance;
}
