import type { RoadTileKind } from '../config/road-catalog';
import { ROAD_TILE_FOOTPRINT } from './map-config';
import { DIR_N, DIR_E, DIR_S, DIR_W } from './direction';

export interface CardinalDeg {
  n: number;
  e: number;
  s: number;
  w: number;
}

export interface RoadDebugSettings {
  footprintScale: number;
  yOffset: number;
  /** Applied to every tile after tile-specific rotation (degrees). */
  defaultRotationDeg: number;
  straightDeg: CardinalDeg;
  bendDeg: { ne: number; es: number; sw: number; wn: number };
  endDeg: CardinalDeg;
  tJunctionDeg: { esw: number; nsw: number; new: number; nes: number };
  crossDeg: CardinalDeg;
}

export const DEFAULT_ROAD_DEBUG: RoadDebugSettings = {
  footprintScale: 1,
  yOffset: 0.02,
  defaultRotationDeg: -90,
  straightDeg: { n: 0, e: 90, s: 0, w: 90 },
  bendDeg: { ne: 270, es: 180, sw: 90, wn: 0 },
  endDeg: { n: 0, e: 90, s: 180, w: 270 },
  tJunctionDeg: { esw: 90, nsw: 0, new: 270, nes: 180 },
  crossDeg: { n: 0, e: 0, s: 0, w: 0 },
};

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Footprint scale applies to straight tiles only. */
export function roadFootprint(
  debug: RoadDebugSettings,
  kind: RoadTileKind,
): number {
  if (kind === 'straight') {
    return ROAD_TILE_FOOTPRINT * debug.footprintScale;
  }
  return ROAD_TILE_FOOTPRINT;
}

export function resolveRoadTileRotationY(
  kind: RoadTileKind,
  mask: number,
  debug: RoadDebugSettings,
): number {
  let tileDeg = 0;

  switch (kind) {
    case 'straight':
      tileDeg =
        mask === (DIR_E | DIR_W) ? debug.straightDeg.e : debug.straightDeg.n;
      break;
    case 'bend':
      if (mask === (DIR_N | DIR_E)) tileDeg = debug.bendDeg.ne;
      else if (mask === (DIR_E | DIR_S)) tileDeg = debug.bendDeg.es;
      else if (mask === (DIR_S | DIR_W)) tileDeg = debug.bendDeg.sw;
      else if (mask === (DIR_W | DIR_N)) tileDeg = debug.bendDeg.wn;
      break;
    case 'end':
      // road_end GLB forward axis is mirrored on E/W vs grid; W slot controls east-facing caps.
      if (mask === DIR_N) tileDeg = debug.endDeg.n;
      else if (mask === DIR_E) tileDeg = debug.endDeg.w;
      else if (mask === DIR_S) tileDeg = debug.endDeg.s;
      else if (mask === DIR_W) tileDeg = debug.endDeg.e;
      break;
    case 'tJunction':
      if (mask === (DIR_E | DIR_S | DIR_W)) tileDeg = debug.tJunctionDeg.esw;
      else if (mask === (DIR_N | DIR_S | DIR_W)) {
        tileDeg = debug.tJunctionDeg.nsw;
      } else if (mask === (DIR_N | DIR_E | DIR_W)) {
        tileDeg = debug.tJunctionDeg.new;
      } else if (mask === (DIR_N | DIR_E | DIR_S)) {
        tileDeg = debug.tJunctionDeg.nes;
      }
      break;
    case 'cross':
      tileDeg = debug.crossDeg.n;
      break;
  }

  return degToRad(tileDeg) + degToRad(debug.defaultRotationDeg);
}
