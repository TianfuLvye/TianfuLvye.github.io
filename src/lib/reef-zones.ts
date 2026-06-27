import * as THREE from 'three';
import {
  TERRAIN_PLATFORM_Y,
  terrainBeachOutward,
  terrainReefBottomY,
  terrainReefOutward,
  terrainSeaY,
  type ContinentMapConfig,
} from './map-config';

export type SkirtSideDef = {
  side: 'north' | 'south' | 'east' | 'west';
  topY: number;
  bottomY: number;
  outward: number;
};

type SideName = SkirtSideDef['side'];

const _edgeA = new THREE.Vector3();
const _edgeB = new THREE.Vector3();
const _faceNormal = new THREE.Vector3();

function addQuadFacing(
  indices: number[],
  i0: number,
  i1: number,
  i2: number,
  i3: number,
  positions: Float32Array,
  outwardNormal: THREE.Vector3,
) {
  const ax = positions[i0 * 3];
  const ay = positions[i0 * 3 + 1];
  const az = positions[i0 * 3 + 2];
  const bx = positions[i1 * 3];
  const by = positions[i1 * 3 + 1];
  const bz = positions[i1 * 3 + 2];
  const cx = positions[i2 * 3];
  const cy = positions[i2 * 3 + 1];
  const cz = positions[i2 * 3 + 2];

  _edgeA.set(bx - ax, by - ay, bz - az);
  _edgeB.set(cx - ax, cy - ay, cz - az);
  _faceNormal.crossVectors(_edgeA, _edgeB);

  if (_faceNormal.dot(outwardNormal) < 0) {
    indices.push(i0, i2, i1, i0, i3, i2);
  } else {
    indices.push(i0, i1, i2, i0, i2, i3);
  }
}

type FrustumOpts = { topCap: boolean };

/**
 * Per-edge terrain wedge.
 * - Reef (topCap=false): steep outer cliff + inner wall, no horizontal rim.
 * - Beach (topCap=true): frustum with horizontal sand shelf + gentle outer slope.
 */
function createFrustumSideGeometry(
  side: SideName,
  mapHalf: number,
  topY: number,
  bottomY: number,
  outward: number,
  { topCap }: FrustumOpts,
): THREE.BufferGeometry {
  const verts: number[] = [];
  const indices: number[] = [];

  const addVert = (x: number, y: number, z: number) => {
    verts.push(x, y, z);
    return verts.length / 3 - 1;
  };

  const up = new THREE.Vector3(0, 1, 0);

  switch (side) {
    case 'north': {
      const i0 = addVert(-mapHalf, topY, mapHalf);
      const i1 = addVert(mapHalf, topY, mapHalf);
      const i4 = addVert(mapHalf + outward, bottomY, mapHalf + outward);
      const i5 = addVert(-mapHalf - outward, bottomY, mapHalf + outward);
      const i6 = addVert(mapHalf, bottomY, mapHalf);
      const i7 = addVert(-mapHalf, bottomY, mapHalf);
      if (topCap) {
        const i2 = addVert(mapHalf + outward, topY, mapHalf + outward);
        const i3 = addVert(-mapHalf - outward, topY, mapHalf + outward);
        const capPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i2, i3, capPos, up);
        addQuadFacing(indices, i3, i2, i4, i5, capPos, new THREE.Vector3(0, 0, 1));
      } else {
        const slopePos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i4, i5, slopePos, new THREE.Vector3(0, 0, 1));
      }
      {
        const cliffPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i6, i7, cliffPos, new THREE.Vector3(0, 0, -1));
      }
      break;
    }
    case 'south': {
      const i0 = addVert(mapHalf, topY, -mapHalf);
      const i1 = addVert(-mapHalf, topY, -mapHalf);
      const i4 = addVert(-mapHalf - outward, bottomY, -mapHalf - outward);
      const i5 = addVert(mapHalf + outward, bottomY, -mapHalf - outward);
      const i6 = addVert(-mapHalf, bottomY, -mapHalf);
      const i7 = addVert(mapHalf, bottomY, -mapHalf);
      if (topCap) {
        const i2 = addVert(-mapHalf - outward, topY, -mapHalf - outward);
        const i3 = addVert(mapHalf + outward, topY, -mapHalf - outward);
        const capPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i2, i3, capPos, up);
        addQuadFacing(indices, i3, i2, i4, i5, capPos, new THREE.Vector3(0, 0, -1));
      } else {
        const slopePos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i4, i5, slopePos, new THREE.Vector3(0, 0, -1));
      }
      {
        const cliffPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i6, i7, cliffPos, new THREE.Vector3(0, 0, 1));
      }
      break;
    }
    case 'east': {
      const i0 = addVert(mapHalf, topY, mapHalf);
      const i1 = addVert(mapHalf, topY, -mapHalf);
      const i4 = addVert(mapHalf + outward, bottomY, -mapHalf - outward);
      const i5 = addVert(mapHalf + outward, bottomY, mapHalf + outward);
      const i6 = addVert(mapHalf, bottomY, -mapHalf);
      const i7 = addVert(mapHalf, bottomY, mapHalf);
      if (topCap) {
        const i2 = addVert(mapHalf + outward, topY, -mapHalf - outward);
        const i3 = addVert(mapHalf + outward, topY, mapHalf + outward);
        const capPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i2, i3, capPos, up);
        addQuadFacing(indices, i3, i2, i4, i5, capPos, new THREE.Vector3(1, 0, 0));
      } else {
        const slopePos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i4, i5, slopePos, new THREE.Vector3(1, 0, 0));
      }
      {
        const cliffPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i6, i7, cliffPos, new THREE.Vector3(-1, 0, 0));
      }
      break;
    }
    case 'west': {
      const i0 = addVert(-mapHalf, topY, -mapHalf);
      const i1 = addVert(-mapHalf, topY, mapHalf);
      const i4 = addVert(-mapHalf - outward, bottomY, mapHalf + outward);
      const i5 = addVert(-mapHalf - outward, bottomY, -mapHalf - outward);
      const i6 = addVert(-mapHalf, bottomY, mapHalf);
      const i7 = addVert(-mapHalf, bottomY, -mapHalf);
      if (topCap) {
        const i2 = addVert(-mapHalf - outward, topY, mapHalf + outward);
        const i3 = addVert(-mapHalf - outward, topY, -mapHalf - outward);
        const capPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i2, i3, capPos, up);
        addQuadFacing(indices, i3, i2, i4, i5, capPos, new THREE.Vector3(-1, 0, 0));
      } else {
        const slopePos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i4, i5, slopePos, new THREE.Vector3(-1, 0, 0));
      }
      {
        const cliffPos = new Float32Array(verts);
        addQuadFacing(indices, i0, i1, i6, i7, cliffPos, new THREE.Vector3(1, 0, 0));
      }
      break;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(verts), 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

const frustumGeometryCache = new Map<string, THREE.BufferGeometry>();

function getFrustumSideGeometry(
  kind: 'reef' | 'beach',
  side: SideName,
  mapHalf: number,
  topY: number,
  bottomY: number,
  outward: number,
): THREE.BufferGeometry {
  const topCap = kind === 'beach';
  const key = `${kind}:v4:${topCap}:${side}:${mapHalf.toFixed(2)}:${topY.toFixed(3)}:${bottomY.toFixed(3)}:${outward.toFixed(2)}`;
  const cached = frustumGeometryCache.get(key);
  if (cached) return cached;

  const geometry = createFrustumSideGeometry(
    side,
    mapHalf,
    topY,
    bottomY,
    outward,
    { topCap },
  );
  frustumGeometryCache.set(key, geometry);
  return geometry;
}

export function getReefSideGeometry(
  side: SideName,
  mapHalf: number,
  topY: number,
  bottomY: number,
  outward: number,
): THREE.BufferGeometry {
  return getFrustumSideGeometry('reef', side, mapHalf, topY, bottomY, outward);
}

export function getBeachSideGeometry(
  side: SideName,
  mapHalf: number,
  topY: number,
  bottomY: number,
  outward: number,
): THREE.BufferGeometry {
  return getFrustumSideGeometry('beach', side, mapHalf, topY, bottomY, outward);
}

const SIDES: SideName[] = ['north', 'south', 'east', 'west'];

export function buildReefSkirts(cfg: ContinentMapConfig): SkirtSideDef[] {
  const outward = terrainReefOutward(cfg);
  const bottomY = terrainReefBottomY(cfg);
  return SIDES.map((side) => ({
    side,
    topY: TERRAIN_PLATFORM_Y,
    bottomY,
    outward,
  }));
}

export function buildBeachSkirts(cfg: ContinentMapConfig): SkirtSideDef[] {
  const outward = terrainBeachOutward(cfg);
  return SIDES.map((side) => ({
    side,
    topY: terrainReefBottomY(cfg),
    bottomY: terrainSeaY(cfg),
    outward,
  }));
}
