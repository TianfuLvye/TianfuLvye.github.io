/** Continent map ground side length (world units). */
export const MAP_SIZE = 28;

/** Multiplier on catalog footprint for GLB buildings. */
export const BUILDING_FOOTPRINT_SCALE = 1.55;

/** Multiplier on decoration catalog footprint and scale caps. */
export const DECOR_FOOTPRINT_SCALE = 2;

/** Orthographic camera zoom; scales with map so the continent fits the view. */
export const MAP_CAMERA_ZOOM = Math.round(48 * (MAP_SIZE / 18));

/** Fine grid resolution (3× the legacy 10×10 layout). */
export const GRID_COLS = 30;
export const GRID_ROWS = 30;

/** World units per fine grid cell (MAP_SIZE / GRID_COLS). */
export const GRID_CELL_SIZE = MAP_SIZE / GRID_COLS;

/** Inset from map edge in fine cells; buildable area is inner (COLS - 2×INSET)². */
export const GRID_BUILDABLE_INSET = 3;

/** All buildings face west (-X) when model default forward is +Z. */
export const GRID_BUILDING_ROTATION = -Math.PI / 2;

/** Building footprint in fine cells (odd spans → unique center cell). */
export const BUILDING_SPAN_SMALL = 3;
export const BUILDING_SPAN_MEDIUM = 5;
export const BUILDING_SPAN_LARGE = 7;

export type BuildingGridSpan =
  | typeof BUILDING_SPAN_SMALL
  | typeof BUILDING_SPAN_MEDIUM
  | typeof BUILDING_SPAN_LARGE;

/** Minimum empty fine cells between building footprints. */
export const BUILDING_MIN_GAP = 2;

/** Forest patch size range in contiguous fine cells (~legacy world size). */
export const GRID_FOREST_MIN_CELLS = 9;
export const GRID_FOREST_MAX_CELLS = 18;

/** Forest patch count baseline at MAP_SIZE = 18. */
export const GRID_FOREST_COUNT = 3;

/** Min Chebyshev distance between forest patch seed cells (fine cells). */
export const GRID_FOREST_MIN_SPACING = 6;

/** Trees per forest cell (dedicated slots, not shared with ground decor). */
export const GRID_FOREST_TREES_MIN = 2;
export const GRID_FOREST_TREES_MAX = 4;

/** Ground decor per forest cell (grass, rocks, flowers, etc.). */
export const GRID_FOREST_GROUND_MIN = 2;
export const GRID_FOREST_GROUND_MAX = 8;

/** Min distance from a tree trunk center for ground decor (world units). */
export const GRID_FOREST_GROUND_TRUNK_CLEARANCE = GRID_CELL_SIZE * 0.12;

/** Min distance between tree centers within the same forest cell. */
export const GRID_FOREST_TREE_MIN_SEPARATION = GRID_CELL_SIZE * 0.32;

/** Default min distance from any building for wild scatter. */
export const DECOR_WILD_MIN_BUILDING_DIST = 1.8;

/** Min distance from buildings for large wild props (oak, rock-large). */
export const DECOR_LARGE_MIN_BUILDING_DIST = 3.2;

/** Per-building probability of generating flower pots. */
export const DECOR_POT_BUILDING_CHANCE = 0.6;

/** Flower patch count baseline at MAP_SIZE = 18 (scaled for fine grid area). */
export const DECOR_FLOWER_PATCH_DENSITY = 15;

/** Wild scatter count baseline at MAP_SIZE = 18 (scaled for fine grid area). */
export const DECOR_WILD_SCATTER_DENSITY = 105;

/** Legacy 10×10 grid cell count used before fine-grid expansion. */
export const LEGACY_GRID_CELLS = 10 * 10;

/** Ratio of current grid area to legacy (30×30 → 9×). */
export const GRID_AREA_SCALE =
  (GRID_COLS * GRID_ROWS) / LEGACY_GRID_CELLS;

/** Scale decor patch counts for map size and finer grid resolution. */
export function decorDensityScale(mapSize: number): number {
  return (mapSize / 18) / Math.sqrt(GRID_AREA_SCALE);
}

/** Hard cap on total decoration instances per continent. */
export const DECOR_MAX_INSTANCES = 700;

/** Max horizontal extent for a small building on a 3×3 plot. */
export const BUILDING_SMALL_FOOTPRINT_MAX =
  BUILDING_SPAN_SMALL * GRID_CELL_SIZE * 0.88;

/** Max horizontal extent for medium buildings on a 5×5 plot. */
export const BUILDING_MEDIUM_FOOTPRINT_MAX =
  BUILDING_SPAN_MEDIUM * GRID_CELL_SIZE * 0.88;

/** Max horizontal extent for large buildings on a 7×7 plot. */
export const BUILDING_LARGE_FOOTPRINT_MAX =
  BUILDING_SPAN_LARGE * GRID_CELL_SIZE * 0.88;

/** One road GLB tile spans one fine grid cell. */
export const ROAD_TILE_FOOTPRINT = GRID_CELL_SIZE;

/** Vertical offset after grounding road tiles on Y. */
export const ROAD_TILE_Y_OFFSET = 0.04;
