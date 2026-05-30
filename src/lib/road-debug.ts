import type { RoadTileKind } from '../config/road-catalog';
import { ROAD_TILE_FOOTPRINT } from './map-config';

export const DIR_N = 1;
export const DIR_E = 2;
export const DIR_S = 4;
export const DIR_W = 8;

export interface RoadDebugSettings {
  footprintScale: number;
  yOffset: number;
  /** Applied to every tile after tile-specific rotation (degrees). */
  defaultRotationDeg: number;
  /** Extra rotation per tile kind (degrees). */
  kindOffsetDeg: Record<RoadTileKind, number>;
  straightDeg: { ew: number; ns: number };
  bendDeg: { ne: number; es: number; sw: number; wn: number };
  endDeg: { n: number; e: number; s: number; w: number };
  tJunctionDeg: { esw: number; nsw: number; new: number; nes: number };
  crossDeg: number;
}

export const DEFAULT_ROAD_DEBUG: RoadDebugSettings = {
  footprintScale: 1,
  yOffset: 0.02,
  defaultRotationDeg: -90,
  kindOffsetDeg: {
    straight: 0,
    bend: 0,
    tJunction: 90,
    cross: 0,
    end: 180,
  },
  straightDeg: { ew: 90, ns: 0 },
  bendDeg: { ne: 270, es: 180, sw: 90, wn: 0 },
  endDeg: { n: 0, e: 90, s: 180, w: -90 },
  tJunctionDeg: { esw: 0, nsw: 90, new: 180, nes: -90 },
  crossDeg: 0,
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
        mask === (DIR_E | DIR_W)
          ? debug.straightDeg.ew
          : debug.straightDeg.ns;
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
      tileDeg = debug.crossDeg;
      break;
  }

  return (
    degToRad(tileDeg) +
    degToRad(debug.defaultRotationDeg) +
    degToRad(debug.kindOffsetDeg[kind])
  );
}
