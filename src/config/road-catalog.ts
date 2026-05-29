import { ROAD_TILE_FOOTPRINT } from '../lib/map-config';

export type RoadTileKind = 'straight' | 'bend' | 'tJunction' | 'cross' | 'end';

export interface RoadTileDef {
  id: string;
  kind: RoadTileKind;
  url: string;
  /** Passed to GlTFModel.footprint — tune via ROAD_TILE_FOOTPRINT in map-config.ts. */
  footprint: number;
  /** Extra Y rotation applied after tile-specific rotation. */
  defaultRotation: number;
}

export const ROAD_TILES: Record<RoadTileKind, RoadTileDef> = {
  straight: {
    id: 'road_side',
    kind: 'straight',
    url: '/models/road_components/road_side.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: 0,
  },
  bend: {
    id: 'road_bend',
    kind: 'bend',
    url: '/models/road_components/road_bend.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: 0,
  },
  tJunction: {
    id: 'road_intersection',
    kind: 'tJunction',
    url: '/models/road_components/road_intersection.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: 0,
  },
  cross: {
    id: 'road_crossroad',
    kind: 'cross',
    url: '/models/road_components/road_crossroad.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: 0,
  },
  end: {
    id: 'road_end',
    kind: 'end',
    url: '/models/road_components/road_end.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: 0,
  },
};

export function enabledRoadTiles(): RoadTileDef[] {
  return Object.values(ROAD_TILES);
}

export function roadTileUrl(kind: RoadTileKind): string {
  return ROAD_TILES[kind].url;
}
