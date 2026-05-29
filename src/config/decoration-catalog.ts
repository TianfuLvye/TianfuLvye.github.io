import {
  DECOR_LARGE_MIN_BUILDING_DIST,
  DECOR_POT_BUILDING_CHANCE,
  DECOR_WILD_MIN_BUILDING_DIST,
} from '../lib/map-config';

/** How to pick the reference extent from the model bounding box. */
export type DecorFitExtent = 'xz' | 'y' | 'max';

export type DecorZone = 'building' | 'wild' | 'cluster-only';

export type DecorClusterKind = 'forest' | 'flower';

export interface DecorationDef {
  id: string;
  url: string;
  weight: number;
  enabled?: boolean;
  zone: DecorZone;
  /** Target size for normalization (default 0.55). */
  footprint?: number;
  /** xz = trees/rocks; y = grass (wide fields); max = large formations. */
  fitExtent?: DecorFitExtent;
  scaleMin?: number;
  scaleMax?: number;
  /** Wild: min distance from nearest building center. */
  minBuildingDist?: number;
  /** Building-adjacent: max distance from owning building center. */
  maxBuildingDist?: number;
  /** Building-adjacent: per-building spawn probability. */
  buildingChance?: number;
  /** Building-adjacent: count range per building [min, max]. */
  perBuildingCount?: [number, number];
  /** Cluster-only: which cluster generator may use this asset. */
  clusterKind?: DecorClusterKind;
}

const FOREST_ASSETS_BASE = '/models/decorations/forest_assets';

const FOREST_TREE_FILES = [
  'tree_01_mesh1114869579.glb',
  'tree_02_mesh373735999.glb',
  'tree_04_mesh1932686607.glb',
  'tree_06_mesh1206298165.glb',
  'tree_07_mesh874600975.glb',
  'tree_08_mesh100681590.glb',
  'tree_10_mesh1145296422.glb',
  'tree_11_mesh546125134.glb',
  'tree_13_mesh2102696020.glb',
  'tree_14_mesh2112331936.glb',
  'tree_16_mesh720331588.glb',
  'tree_17_mesh1958235271.glb',
  'tree_18_mesh1610579876.glb',
] as const;

function forestDecorations(): Record<string, DecorationDef> {
  const entries: Record<string, DecorationDef> = {};

  for (const file of FOREST_TREE_FILES) {
    const num = file.match(/tree_(\d+)_/)?.[1] ?? file;
    const id = `forest-tree-${num}`;
    entries[id] = {
      id,
      url: `${FOREST_ASSETS_BASE}/${file}`,
      weight: 6,
      zone: 'cluster-only',
      clusterKind: 'forest',
      footprint: 0.38,
      fitExtent: 'xz',
    };
  }

  entries['forest-grass'] = {
    id: 'forest-grass',
    url: `${FOREST_ASSETS_BASE}/grass.glb`,
    weight: 12,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.1,
    fitExtent: 'y',
    scaleMax: 0.1,
  };
  entries['forest-tuft-of-grass'] = {
    id: 'forest-tuft-of-grass',
    url: `${FOREST_ASSETS_BASE}/Tuft of Grass.glb`,
    weight: 8,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.4,
    fitExtent: 'y',
    scaleMax: 1.2,
  };
  entries['forest-grass-yellowing'] = {
    id: 'forest-grass-yellowing',
    url: `${FOREST_ASSETS_BASE}/grass yellowing.glb`,
    weight: 2,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.2,
    fitExtent: 'y',
    scaleMax: 0.3,
  };
  entries['forest-rocks'] = {
    id: 'forest-rocks',
    url: `${FOREST_ASSETS_BASE}/rocks.glb`,
    weight: 3,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.24,
    fitExtent: 'y',
    scaleMax: 0.30,
  };
  entries['forest-split-rocks'] = {
    id: 'forest-split-rocks',
    url: `${FOREST_ASSETS_BASE}/split rocks.glb`,
    weight: 1,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.06,
    fitExtent: 'y',
    scaleMax: 0.12,
  };
  entries['forest-stone-1'] = {
    id: 'forest-stone-1',
    url: `${FOREST_ASSETS_BASE}/stone1.glb`,
    weight: 3,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.16,
    fitExtent: 'y',
    scaleMax: 0.32,
  };
  entries['forest-stone-2'] = {
    id: 'forest-stone-2',
    url: `${FOREST_ASSETS_BASE}/stone2.glb`,
    weight: 3,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.16,
    fitExtent: 'y',
    scaleMax: 0.32,
  };
  entries['forest-flower'] = {
    id: 'forest-flower',
    url: `${FOREST_ASSETS_BASE}/Flower.glb`,
    weight: 4,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.09,
    fitExtent: 'y',
    scaleMax: 0.16,
  };
  entries['forest-tulip1'] = {
    id: 'forest-tulip1',
    url: `${FOREST_ASSETS_BASE}/Tulip1.glb`,
    weight: 2,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.5,
    fitExtent: 'xz',
    scaleMax: 0.65,
  };
  entries['forest-tulip2'] = {
    id: 'forest-tulip2',
    url: `${FOREST_ASSETS_BASE}/Tulip2.glb`,
    weight: 2,
    zone: 'cluster-only',
    clusterKind: 'forest',
    footprint: 0.08,
    fitExtent: 'xz',
    scaleMax: 0.1,
  };

  return entries;
}

export const DECORATIONS: Record<string, DecorationDef> = {
  tree: {
    id: 'tree',
    url: '/models/decorations/tree.glb',
    weight: 8,
    zone: 'wild',
    footprint: 0.55,
    fitExtent: 'xz',
    minBuildingDist: DECOR_WILD_MIN_BUILDING_DIST,
  },
  'grass-mix': {
    id: 'grass-mix',
    url: '/models/decorations/grass mix.glb',
    weight: 10,
    zone: 'wild',
    footprint: 0.42,
    fitExtent: 'y',
    scaleMax: 0.48,
    minBuildingDist: DECOR_WILD_MIN_BUILDING_DIST,
  },
  grass: {
    id: 'grass',
    url: '/models/decorations/grass.glb',
    weight: 18,
    zone: 'wild',
    footprint: 0.1,
    fitExtent: 'y',
    scaleMax: 0.1,
    minBuildingDist: DECOR_WILD_MIN_BUILDING_DIST,
  },
  'tuft-of-grass': {
    id: 'tuft-of-grass',
    url: '/models/decorations/Tuft of Grass.glb',
    weight: 15,
    zone: 'wild',
    footprint: 0.4,
    fitExtent: 'y',
    scaleMax: 1.2,
    minBuildingDist: DECOR_WILD_MIN_BUILDING_DIST,
  },
  rock: {
    id: 'rock',
    url: '/models/decorations/rock.glb',
    weight: 2,
    zone: 'wild',
    footprint: 0.03,
    fitExtent: 'xz',
    scaleMax: 0.05,
    minBuildingDist: DECOR_WILD_MIN_BUILDING_DIST,
  },
  rocks: {
    id: 'rocks',
    url: '/models/decorations/rocks.glb',
    weight: 2,
    zone: 'wild',
    footprint: 1.16,
    fitExtent: 'y',
    scaleMax: 2.22,
    minBuildingDist: DECOR_WILD_MIN_BUILDING_DIST,
  },
  'split-rocks': {
    id: 'split-rocks',
    url: '/models/decorations/split rocks.glb',
    weight: 2,
    zone: 'wild',
    footprint: 0.16,
    fitExtent: 'y',
    scaleMax: 0.22,
    minBuildingDist: DECOR_WILD_MIN_BUILDING_DIST,
  },
  'rock-large-1': {
    id: 'rock-large-1',
    url: '/models/decorations/rock-large-1.glb',
    weight: 2,
    zone: 'wild',
    footprint: 0.36,
    fitExtent: 'max',
    scaleMax: 0.50,
    minBuildingDist: DECOR_LARGE_MIN_BUILDING_DIST,
  },
  'rock-large-2': {
    id: 'rock-large-2',
    url: '/models/decorations/rock-large-2.glb',
    weight: 2,
    zone: 'wild',
    footprint: 0.16,
    fitExtent: 'max',
    scaleMax: 0.28,
    minBuildingDist: DECOR_LARGE_MIN_BUILDING_DIST,
  },
  'oak-tree': {
    id: 'oak-tree',
    url: '/models/decorations/Oak Tree.glb',
    weight: 1,
    zone: 'wild',
    footprint: 1.00,
    fitExtent: 'xz',
    minBuildingDist: DECOR_LARGE_MIN_BUILDING_DIST,
  },
  flower: {
    id: 'flower',
    url: '/models/decorations/Flower.glb',
    weight: 1,
    zone: 'cluster-only',
    clusterKind: 'flower',
    footprint: 0.09,
    fitExtent: 'y',
    scaleMax: 0.16,
  },
  'tulip1': {
    id: 'tulip1',
    url: '/models/decorations/Tulip1.glb',
    weight: 0.5,
    zone: 'cluster-only',
    clusterKind: 'flower',
    footprint: 0.50,
    fitExtent: 'xz',
    scaleMax: 0.65,
  },
  'tulip2': {
    id: 'tulip2',
    url: '/models/decorations/Tulip2.glb',
    weight: 0.5,
    zone: 'cluster-only',
    clusterKind: 'flower',
    footprint: 0.08,
    fitExtent: 'xz',
    scaleMax: 0.10,
  },
  'potted-plant': {
    id: 'potted-plant',
    url: '/models/decorations/Potted plant.glb',
    weight: 0.5,
    zone: 'building',
    footprint: 0.22,
    fitExtent: 'xz',
    buildingChance: DECOR_POT_BUILDING_CHANCE,
    maxBuildingDist: 1.6,
    perBuildingCount: [0, 1],
  },
  'plant-flower-pot': {
    id: 'plant-flower-pot',
    url: '/models/decorations/Plant - Flower Pot.glb',
    weight: 0.5,
    zone: 'building',
    footprint: 0.24,
    fitExtent: 'xz',
    buildingChance: DECOR_POT_BUILDING_CHANCE,
    maxBuildingDist: 1.6,
    perBuildingCount: [0, 1],
  },
  crops: {
    id: 'crops',
    url: '/models/decorations/crops.glb',
    weight: 0.2,
    footprint: 1.00,
    scaleMax: 1.10,
    zone: 'wild',
    // enabled: false,
  },
  ...forestDecorations(),
};

export type DecorationId = keyof typeof DECORATIONS;

export function enabledDecorations(): DecorationDef[] {
  return Object.values(DECORATIONS).filter((d) => d.enabled !== false);
}

export function decorationsByZone(zone: DecorZone): DecorationDef[] {
  return enabledDecorations().filter(
    (d) => d.zone === zone && d.weight > 0,
  );
}

export function decorationsByClusterKind(kind: DecorClusterKind): DecorationDef[] {
  return enabledDecorations().filter(
    (d) => d.zone === 'cluster-only' && d.clusterKind === kind && d.weight > 0,
  );
}

export function getDecoration(id: string): DecorationDef | undefined {
  const def = DECORATIONS[id];
  if (!def || def.enabled === false) return undefined;
  return def;
}

export function decorationUrl(id: string): string | undefined {
  return getDecoration(id)?.url;
}

/** Weighted pick from a pool using rng in [0, 1). */
export function pickFromPool(
  rng: () => number,
  pool: DecorationDef[],
): string {
  if (pool.length === 0) return '';
  const total = pool.reduce((s, d) => s + d.weight, 0);
  if (total <= 0) return pool[0].id;
  let t = rng() * total;
  for (const d of pool) {
    t -= d.weight;
    if (t <= 0) return d.id;
  }
  return pool[pool.length - 1].id;
}

/** @deprecated Use pickFromPool with decorationsByZone('wild') instead. */
export function pickDecorationId(rng: () => number): DecorationId {
  return pickFromPool(rng, decorationsByZone('wild')) as DecorationId;
}
