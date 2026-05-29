/** Continent map ground side length (world units). */
export const MAP_SIZE = 28;

/** Multiplier on catalog footprint for GLB buildings. */
export const BUILDING_FOOTPRINT_SCALE = 1.55;

/** Multiplier on decoration catalog footprint and scale caps. */
export const DECOR_FOOTPRINT_SCALE = 2;

/** Orthographic camera zoom; scales with map so the continent fits the view. */
export const MAP_CAMERA_ZOOM = Math.round(48 * (MAP_SIZE / 18));

/** Grid columns and rows covering the full map. */
export const GRID_COLS = 10;
export const GRID_ROWS = 10;

/** World units per grid cell (MAP_SIZE / GRID_COLS). */
export const GRID_CELL_SIZE = MAP_SIZE / GRID_COLS;

/** Inset from map edge in cells; buildable area is inner (GRID_COLS - 2*INSET)². */
export const GRID_BUILDABLE_INSET = 1;

/** All buildings face west (-X) when model default forward is +Z. */
export const GRID_BUILDING_ROTATION = -Math.PI / 2;

/** Forest patch size range in contiguous cells. */
export const GRID_FOREST_MIN_CELLS = 3;
export const GRID_FOREST_MAX_CELLS = 6;

/** Forest patch count baseline at MAP_SIZE = 18. */
export const GRID_FOREST_COUNT = 3;

/** Min Chebyshev distance between forest patch seed cells. */
export const GRID_FOREST_MIN_SPACING = 2;

/** Default min distance from any building for wild scatter. */
export const DECOR_WILD_MIN_BUILDING_DIST = 1.8;

/** Min distance from buildings for large wild props (oak, rock-large). */
export const DECOR_LARGE_MIN_BUILDING_DIST = 3.2;

/** Per-building probability of generating flower pots. */
export const DECOR_POT_BUILDING_CHANCE = 0.6;

/** Flower patch count baseline at MAP_SIZE = 18. */
export const DECOR_FLOWER_PATCH_DENSITY = 5;

/** Wild scatter count baseline at MAP_SIZE = 18. */
export const DECOR_WILD_SCATTER_DENSITY = 35;
