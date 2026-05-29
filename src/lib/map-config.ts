/** Continent map ground side length (world units). */
export const MAP_SIZE = 28;

/** Inset from map edge when placing buildings. */
export const BUILDING_EDGE_MARGIN = 2.8;

/** Min center-to-center distance between buildings. */
export const BUILDING_MIN_SPACING = 3.6;

/** Multiplier on catalog footprint for GLB buildings. */
export const BUILDING_FOOTPRINT_SCALE = 1.55;

/** Multiplier on decoration catalog footprint and scale caps. */
export const DECOR_FOOTPRINT_SCALE = 2;

/** Orthographic camera zoom; scales with map so the continent fits the view. */
export const MAP_CAMERA_ZOOM = Math.round(48 * (MAP_SIZE / 18));

/** Default min distance from any building for wild scatter. */
export const DECOR_WILD_MIN_BUILDING_DIST = 1.8;

/** Min distance from buildings for large wild props (oak, rock-large). */
export const DECOR_LARGE_MIN_BUILDING_DIST = 3.2;

/** Per-building probability of generating flower pots. */
export const DECOR_POT_BUILDING_CHANCE = 0.6;

/** Tree grove count baseline at MAP_SIZE = 18. */
export const DECOR_TREE_GROVE_DENSITY = 3;

/** Flower patch count baseline at MAP_SIZE = 18. */
export const DECOR_FLOWER_PATCH_DENSITY = 5;

/** Min center-to-center distance between cluster origins. */
export const DECOR_CLUSTER_MIN_SPACING = 2.8;

/** Wild scatter count baseline at MAP_SIZE = 18. */
export const DECOR_WILD_SCATTER_DENSITY = 35;
