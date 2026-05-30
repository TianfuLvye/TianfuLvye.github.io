import { ROAD_TILE_DEFAULT_ROTATION, ROAD_TILE_FOOTPRINT } from '../lib/map-config';
import { DIR_E, DIR_W } from '../lib/road-debug';

export type RoadTileKind = 'straight' | 'bend' | 'tJunction' | 'cross' | 'end';

export interface RoadTileDef {
  id: string;
  kind: RoadTileKind;
  url: string;
  footprint: number;
  defaultRotation: number;
}

export const STRAIGHT_ROAD_EW_URL =
  '/models/road_components/road_drivewayDoubleBarrier.glb';
export const STRAIGHT_ROAD_NS_URL =
  '/models/road_components/road_drivewaySingleBarrier.glb';

export const ROAD_TILES: Record<RoadTileKind, RoadTileDef> = {
  straight: {
    id: 'road_drivewayDoubleBarrier',
    kind: 'straight',
    url: STRAIGHT_ROAD_EW_URL,
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: ROAD_TILE_DEFAULT_ROTATION,
  },
  bend: {
    id: 'road_bend',
    kind: 'bend',
    url: '/models/road_components/road_bend.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: ROAD_TILE_DEFAULT_ROTATION,
  },
  tJunction: {
    id: 'road_intersection',
    kind: 'tJunction',
    url: '/models/road_components/road_intersection.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: ROAD_TILE_DEFAULT_ROTATION,
  },
  cross: {
    id: 'road_crossroad',
    kind: 'cross',
    url: '/models/road_components/road_crossroad.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: ROAD_TILE_DEFAULT_ROTATION,
  },
  end: {
    id: 'road_end',
    kind: 'end',
    url: '/models/road_components/road_end.glb',
    footprint: ROAD_TILE_FOOTPRINT,
    defaultRotation: ROAD_TILE_DEFAULT_ROTATION,
  },
};

/** E↔W → double barrier; N↔S → single barrier (one lamp side). */
export function straightRoadUrlForMask(mask: number): string {
  return mask === (DIR_E | DIR_W) ? STRAIGHT_ROAD_EW_URL : STRAIGHT_ROAD_NS_URL;
}

export function enabledRoadTiles(): RoadTileDef[] {
  return [
    ...Object.values(ROAD_TILES),
    {
      id: 'road_drivewaySingleBarrier',
      kind: 'straight',
      url: STRAIGHT_ROAD_NS_URL,
      footprint: ROAD_TILE_FOOTPRINT,
      defaultRotation: ROAD_TILE_DEFAULT_ROTATION,
    },
  ];
}

export function roadTileUrl(kind: RoadTileKind): string {
  return ROAD_TILES[kind].url;
}
