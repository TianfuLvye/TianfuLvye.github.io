/** Continent map ground side length (world units). */
export const MAP_SIZE = 28;

/** Inset from map edge when placing buildings. */
export const BUILDING_EDGE_MARGIN = 2.8;

/** Min center-to-center distance between buildings. */
export const BUILDING_MIN_SPACING = 3.6;

/** Multiplier on catalog footprint for GLB buildings. */
export const BUILDING_FOOTPRINT_SCALE = 1.55;

/** Orthographic camera zoom; scales with map so the continent fits the view. */
export const MAP_CAMERA_ZOOM = Math.round(48 * (MAP_SIZE / 18));
