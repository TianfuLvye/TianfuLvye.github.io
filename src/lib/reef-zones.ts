import * as THREE from 'three';
import {
  TERRAIN_PLATFORM_Y,
  TERRAIN_REEF_BOTTOM_Y,
  TERRAIN_SEA_Y,
  terrainBeachOutward,
  terrainReefOutward,
  type ContinentMapConfig,
} from './map-config';

export type SkirtSideDef = {
  side: 'north' | 'south' | 'east' | 'west';
  topY: number;
  bottomY: number;
  outward: number;
};

type SideName = SkirtSideDef['side'];

function createSkirtSideGeometry(
  side: SideName,
  mapHalf: number,
  topY: number,
  bottomY: number,
  outward: number,
): THREE.BufferGeometry {
  const positions = new Float32Array(12);

  switch (side) {
    case 'north':
      positions.set([
        -mapHalf, topY, mapHalf,
        mapHalf, topY, mapHalf,
        mapHalf + outward, bottomY, mapHalf + outward,
        -mapHalf - outward, bottomY, mapHalf + outward,
      ]);
      break;
    case 'south':
      positions.set([
        mapHalf, topY, -mapHalf,
        -mapHalf, topY, -mapHalf,
        -mapHalf - outward, bottomY, -mapHalf - outward,
        mapHalf + outward, bottomY, -mapHalf - outward,
      ]);
      break;
    case 'east':
      positions.set([
        mapHalf, topY, mapHalf,
        mapHalf, topY, -mapHalf,
        mapHalf + outward, bottomY, -mapHalf - outward,
        mapHalf + outward, bottomY, mapHalf + outward,
      ]);
      break;
    case 'west':
      positions.set([
        -mapHalf, topY, -mapHalf,
        -mapHalf, topY, mapHalf,
        -mapHalf - outward, bottomY, mapHalf + outward,
        -mapHalf - outward, bottomY, -mapHalf - outward,
      ]);
      break;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

const skirtGeometryCache = new Map<string, THREE.BufferGeometry>();

export function getSkirtSideGeometry(
  side: SideName,
  mapHalf: number,
  topY: number,
  bottomY: number,
  outward: number,
): THREE.BufferGeometry {
  const key = `${side}:${mapHalf.toFixed(2)}:${topY}:${bottomY}:${outward.toFixed(2)}`;
  const cached = skirtGeometryCache.get(key);
  if (cached) return cached;

  const geometry = createSkirtSideGeometry(side, mapHalf, topY, bottomY, outward);
  skirtGeometryCache.set(key, geometry);
  return geometry;
}

const SIDES: SideName[] = ['north', 'south', 'east', 'west'];

export function buildReefSkirts(cfg: ContinentMapConfig): SkirtSideDef[] {
  const outward = terrainReefOutward(cfg);
  return SIDES.map((side) => ({
    side,
    topY: TERRAIN_PLATFORM_Y,
    bottomY: TERRAIN_REEF_BOTTOM_Y,
    outward,
  }));
}

export function buildBeachSkirts(cfg: ContinentMapConfig): SkirtSideDef[] {
  const outward = terrainBeachOutward(cfg);
  return SIDES.map((side) => ({
    side,
    topY: TERRAIN_REEF_BOTTOM_Y,
    bottomY: TERRAIN_SEA_Y,
    outward,
  }));
}
