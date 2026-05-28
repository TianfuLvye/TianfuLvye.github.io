export type SizeTier = 'small' | 'medium' | 'large';

export interface BuildingDef {
  id: string;
  url: string;
  sizeTier: SizeTier;
  footprint: number;
  yOffset?: number;
  weight?: number;
  enabled?: boolean;
}

export const BUILDINGS: Record<string, BuildingDef> = {
  house: {
    id: 'house',
    url: '/models/buildings/house.glb',
    sizeTier: 'small',
    footprint: 0.9,
    weight: 2,
  },
  houses: {
    id: 'houses',
    url: '/models/buildings/houses.glb',
    sizeTier: 'small',
    footprint: 1.0,
    weight: 1,
  },
  'small-farm': {
    id: 'small-farm',
    url: '/models/buildings/small-farm.glb',
    sizeTier: 'small',
    footprint: 1.0,
    weight: 1,
  },
  'small-temple': {
    id: 'small-temple',
    url: '/models/buildings/small-temple.glb',
    sizeTier: 'small',
    footprint: 0.85,
    weight: 1,
  },
  windmill: {
    id: 'windmill',
    url: '/models/buildings/windmill.glb',
    sizeTier: 'medium',
    footprint: 1.0,
    weight: 1,
  },
  'watch-tower': {
    id: 'watch-tower',
    url: '/models/buildings/watch-tower.glb',
    sizeTier: 'medium',
    footprint: 0.95,
    weight: 1,
  },
  'fantasy-inn': {
    id: 'fantasy-inn',
    url: '/models/buildings/fantasy-inn.glb',
    sizeTier: 'medium',
    footprint: 1.05,
    weight: 1,
  },
  'medium-temple': {
    id: 'medium-temple',
    url: '/models/buildings/medium-temple.glb',
    sizeTier: 'medium',
    footprint: 1.0,
    weight: 1,
  },
  'market-stalls-compact': {
    id: 'market-stalls-compact',
    url: '/models/buildings/market-stalls-compact.glb',
    sizeTier: 'medium',
    footprint: 1.1,
    weight: 1,
  },
  'bell-tower': {
    id: 'bell-tower',
    url: '/models/buildings/bell-tower.glb',
    sizeTier: 'large',
    footprint: 1.0,
    weight: 1,
  },
  castle: {
    id: 'castle',
    url: '/models/buildings/castle.glb',
    sizeTier: 'large',
    footprint: 1.15,
    weight: 1,
  },
  pagoda: {
    id: 'pagoda',
    url: '/models/buildings/pagoda.glb',
    sizeTier: 'large',
    footprint: 1.1,
    weight: 1,
  },
  'big-temple': {
    id: 'big-temple',
    url: '/models/buildings/big-temple.glb',
    sizeTier: 'large',
    footprint: 1.1,
    weight: 1,
  },
  'step-pyramid': {
    id: 'step-pyramid',
    url: '/models/buildings/step-pyramid.glb',
    sizeTier: 'large',
    footprint: 1.0,
    weight: 1,
  },
  'castle-1234': {
    id: 'castle-1234',
    url: '/models/buildings/castle-1234.glb',
    sizeTier: 'large',
    footprint: 1.2,
    enabled: false,
  },
  'lady-liberty': {
    id: 'lady-liberty',
    url: '/models/buildings/lady-liberty.glb',
    sizeTier: 'large',
    footprint: 0.9,
    enabled: false,
  },
};

export type BuildingId = keyof typeof BUILDINGS;

export function isBuildingId(id: string): id is BuildingId {
  return id in BUILDINGS;
}

export function getBuilding(id: string): BuildingDef | undefined {
  const def = BUILDINGS[id];
  if (!def || def.enabled === false) return undefined;
  return def;
}

export function enabledBuildings(): BuildingDef[] {
  return Object.values(BUILDINGS).filter((b) => b.enabled !== false);
}

export function buildingUrl(id: string): string | undefined {
  return getBuilding(id)?.url;
}
