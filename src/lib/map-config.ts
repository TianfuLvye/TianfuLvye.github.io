/** Base continent map ground side length (world units). */
export const MAP_SIZE_BASE = 28;

/** Multiplier on catalog footprint for GLB buildings. */
export const BUILDING_FOOTPRINT_SCALE = 1.55;

/** Multiplier on decoration catalog footprint and scale caps. */
export const DECOR_FOOTPRINT_SCALE = 2;

/** Base fine grid resolution (3× the legacy 10×10 layout). */
export const GRID_BASE = 30;

/** World units per fine grid cell at base size (MAP_SIZE_BASE / GRID_BASE). */
export const GRID_CELL_SIZE = MAP_SIZE_BASE / GRID_BASE;

/** Orthographic camera zoom at base size; scales with map so the continent fits the view. */
export const MAP_CAMERA_ZOOM = Math.round(48 * (MAP_SIZE_BASE / 18));

/** Most zoomed-out level at base map size (smaller zoom = wider view). */
export const MAP_CAMERA_MIN_ZOOM_BASE = 20;

/** maxZoom as a multiple of default cameraZoom. */
export const MAP_CAMERA_MAX_ZOOM_FACTOR = 2;

/** Inset from map edge in fine cells; buildable area is inner (COLS - 2×INSET)². */
export const GRID_BUILDABLE_INSET = 3;

/** Notes at or below this count use the base map size. */
export const CONTINENT_NOTE_GROWTH_THRESHOLD = 10;

/** Every N notes beyond the threshold triggers one growth step. */
export const CONTINENT_GROWTH_BATCH = 5;

/** Grid columns/rows added per growth step. */
export const CONTINENT_GRID_STEP = 6;

/** All buildings share one Y rotation (model default forward is +Z). */
export const GRID_BUILDING_ROTATION = Math.PI / 2;

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

/** Forest edge ribbons along map sides (world units) at base size. */
export const FOREST_RIBBON_LENGTH = MAP_SIZE_BASE * 0.72;
export const FOREST_RIBBON_WIDTH = 3.2;

/** Perimeter-biased elliptical forest patches. */
export const FOREST_ELLIPSE_COUNT = 2;
export const FOREST_ELLIPSE_RX_MIN = 3.5;
export const FOREST_ELLIPSE_RX_MAX = 5.5;
export const FOREST_ELLIPSE_RZ_MIN = 2.5;
export const FOREST_ELLIPSE_RZ_MAX = 4.5;

/** Ellipse center radius as a fraction of buildable half-extent (biased toward edges). */
export const FOREST_EDGE_CENTER_MIN = 0.55;
export const FOREST_EDGE_CENTER_MAX = 0.88;

/** Soft zone boundary — decor only inside this fraction of ellipse radius. */
export const FOREST_EDGE_FALLOFF = 0.92;

/** Medium tree / ground density per square world unit inside forest zones. */
export const FOREST_TREE_DENSITY = 0.4;
export const FOREST_GROUND_DENSITY = 0.22;

/** Min world distance from forest decor to nearest building. */
export const FOREST_MIN_BUILDING_DIST = 2.0;

/** Min distance from a tree trunk center for ground decor (world units) at base size. */
export const GRID_FOREST_GROUND_TRUNK_CLEARANCE = (MAP_SIZE_BASE / 10) * 0.12;

/** Min distance between tree centers within a forest zone (world units) at base size. */
export const GRID_FOREST_TREE_MIN_SEPARATION = (MAP_SIZE_BASE / 10) * 0.32;

/** Default min distance from any building for wild scatter. */
export const DECOR_WILD_MIN_BUILDING_DIST = 1.8;

/** Min distance from buildings for large wild props (oak, rock-large). */
export const DECOR_LARGE_MIN_BUILDING_DIST = 3.2;

/** Per-building probability of generating flower pots. */
export const DECOR_POT_BUILDING_CHANCE = 0.6;

/** Flower patch count baseline at map size 18 (scaled for fine grid area). */
export const DECOR_FLOWER_PATCH_DENSITY = 15;

/** Wild scatter count baseline at map size 18 (scaled for fine grid area). */
export const DECOR_WILD_SCATTER_DENSITY = 105;

/** Hard cap on total decoration instances per continent at base map size. */
export const DECOR_MAX_INSTANCES = 700;

/** Legacy 10×10 grid cell count used before fine-grid expansion. */
export const LEGACY_GRID_CELLS = 10 * 10;

/** Ratio of base grid area to legacy (30×30 → 9×). */
export const GRID_AREA_SCALE =
  (GRID_BASE * GRID_BASE) / LEGACY_GRID_CELLS;

export interface ContinentMapConfig {
  mapSize: number;
  gridCols: number;
  gridRows: number;
  cellSize: number;
  buildableInset: number;
  cameraZoom: number;
  cameraMinZoom: number;
  cameraMaxZoom: number;
  gridAreaScale: number;
  forestRibbonLength: number;
  forestGroundTrunkClearance: number;
  forestTreeMinSeparation: number;
  /** (mapSize / MAP_SIZE_BASE)² — decor/forest counts scale with this. */
  areaScale: number;
  /** mapSize / MAP_SIZE_BASE — forest ellipse radii scale with this. */
  sideScale: number;
  footprintMax: {
    small: number;
    medium: number;
    large: number;
  };
  roadTileFootprint: number;
}

/** Per-continent map dimensions derived from note count. */
export function continentMapConfig(noteCount: number): ContinentMapConfig {
  const excess = Math.max(0, noteCount - CONTINENT_NOTE_GROWTH_THRESHOLD);
  const growthSteps = Math.ceil(excess / CONTINENT_GROWTH_BATCH);
  const gridCols = GRID_BASE + growthSteps * CONTINENT_GRID_STEP;
  const gridRows = gridCols;
  const mapSize = MAP_SIZE_BASE * (gridCols / GRID_BASE);
  const cellSize = mapSize / gridCols;
  const gridAreaScale = (gridCols * gridRows) / LEGACY_GRID_CELLS;
  const sideScale = mapSize / MAP_SIZE_BASE;
  const areaScale = sideScale * sideScale;
  const cameraZoom = Math.round(48 * (mapSize / 18));
  // Inverse to mapSize: larger continents need a lower minZoom to overview the full ground.
  const cameraMinZoom = Math.max(
    4,
    Math.round(MAP_CAMERA_MIN_ZOOM_BASE * MAP_SIZE_BASE / mapSize),
  );
  const cameraMaxZoom = Math.round(cameraZoom * MAP_CAMERA_MAX_ZOOM_FACTOR);

  return {
    mapSize,
    gridCols,
    gridRows,
    cellSize,
    buildableInset: GRID_BUILDABLE_INSET,
    cameraZoom,
    cameraMinZoom,
    cameraMaxZoom,
    gridAreaScale,
    forestRibbonLength: mapSize * 0.72,
    forestGroundTrunkClearance: (mapSize / 10) * 0.12,
    forestTreeMinSeparation: (mapSize / 10) * 0.32,
    areaScale,
    sideScale,
    footprintMax: {
      small: BUILDING_SPAN_SMALL * cellSize * 0.88,
      medium: BUILDING_SPAN_MEDIUM * cellSize * 0.88,
      large: BUILDING_SPAN_LARGE * cellSize * 0.88,
    },
    roadTileFootprint: cellSize,
  };
}

/** Base map config (≤10 notes). */
export const DEFAULT_MAP_CONFIG = continentMapConfig(0);

/** Decor/flower/wild scatter count multiplier vs base map (side length ratio squared). */
export function decorDensityScale(cfg: ContinentMapConfig): number {
  return cfg.areaScale;
}

/** Max decoration instances for a continent (scales with map area). */
export function decorMaxInstances(cfg: ContinentMapConfig): number {
  return Math.round(DECOR_MAX_INSTANCES * cfg.areaScale);
}

/** One road GLB tile spans one fine grid cell (base size). */
export const ROAD_TILE_FOOTPRINT = GRID_CELL_SIZE;

/** Vertical offset after grounding road tiles on Y. */
export const ROAD_TILE_Y_OFFSET = 0.04;
