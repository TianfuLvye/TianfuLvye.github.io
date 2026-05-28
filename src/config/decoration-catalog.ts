/** How to pick the reference extent from the model bounding box. */
export type DecorFitExtent = 'xz' | 'y' | 'max';

export interface DecorationDef {
  id: string;
  url: string;
  weight: number;
  enabled?: boolean;
  /** Target size for normalization (default 0.55). */
  footprint?: number;
  /** xz = trees/rocks; y = grass/flowers (wide fields); max = large formations. */
  fitExtent?: DecorFitExtent;
  scaleMin?: number;
  scaleMax?: number;
}

export const DECORATIONS: Record<string, DecorationDef> = {
  tree: {
    id: 'tree',
    url: '/models/decorations/tree.glb',
    weight: 35,
    footprint: 0.55,
    fitExtent: 'xz',
  },
  'pine-trees': {
    id: 'pine-trees',
    url: '/models/decorations/pine-trees.glb',
    weight: 15,
    footprint: 0.58,
    fitExtent: 'xz',
  },
  grass: {
    id: 'grass',
    url: '/models/decorations/grass.glb',
    weight: 25,
    footprint: 0.42,
    fitExtent: 'y',
    scaleMax: 0.48,
  },
  flowers: {
    id: 'flowers',
    url: '/models/decorations/flowers.glb',
    weight: 15,
    footprint: 0.38,
    fitExtent: 'y',
    scaleMax: 0.42,
  },
  rock: {
    id: 'rock',
    url: '/models/decorations/rock.glb',
    weight: 12,
    footprint: 0.32,
    fitExtent: 'xz',
    scaleMax: 0.36,
  },
  rocks: {
    id: 'rocks',
    url: '/models/decorations/rocks.glb',
    weight: 3,
    footprint: 0.16,
    fitExtent: 'y',
    scaleMax: 0.22,
  },
  'rock-large-1': {
    id: 'rock-large-1',
    url: '/models/decorations/rock-large-1.glb',
    weight: 2,
    footprint: 0.36,
    fitExtent: 'max',
    scaleMax: 0.28,
  },
  'rock-large-2': {
    id: 'rock-large-2',
    url: '/models/decorations/rock-large-2.glb',
    weight: 1,
    footprint: 0.36,
    fitExtent: 'max',
    scaleMax: 0.28,
  },
  crops: {
    id: 'crops',
    url: '/models/decorations/crops.glb',
    weight: 5,
    enabled: false,
  },
};

export type DecorationId = keyof typeof DECORATIONS;

export function enabledDecorations(): DecorationDef[] {
  return Object.values(DECORATIONS).filter(
    (d) => d.enabled !== false && d.weight > 0,
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

/** Weighted pick using rng in [0, 1). */
export function pickDecorationId(rng: () => number): DecorationId {
  const pool = enabledDecorations();
  const total = pool.reduce((s, d) => s + d.weight, 0);
  let t = rng() * total;
  for (const d of pool) {
    t -= d.weight;
    if (t <= 0) return d.id as DecorationId;
  }
  return pool[pool.length - 1].id as DecorationId;
}
