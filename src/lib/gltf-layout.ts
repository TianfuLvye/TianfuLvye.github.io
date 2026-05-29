import * as THREE from 'three';
import type { DecorFitExtent } from '../config/decoration-catalog';

export interface GltfLayoutParams {
  footprint: number;
  scale?: [number, number, number];
  yOffset?: number;
  uniformScale?: boolean;
  fitExtent?: DecorFitExtent;
  scaleMin?: number;
  scaleMax?: number;
}

export interface GltfLayoutResult {
  position: [number, number, number];
  modelScale: [number, number, number];
  height: number;
  localSize: THREE.Vector3;
  localMin: THREE.Vector3;
  localMax: THREE.Vector3;
}

function extentFromSize(
  size: THREE.Vector3,
  fitExtent: DecorFitExtent,
): number {
  if (fitExtent === 'y') return size.y;
  if (fitExtent === 'max') return Math.max(size.x, size.y, size.z);
  return Math.max(size.x, size.z);
}

export function measureSceneBounds(scene: THREE.Object3D): {
  localSize: THREE.Vector3;
  localMin: THREE.Vector3;
  localMax: THREE.Vector3;
} {
  const box = new THREE.Box3().setFromObject(scene);
  return {
    localSize: box.getSize(new THREE.Vector3()),
    localMin: box.min.clone(),
    localMax: box.max.clone(),
  };
}

export function computeGltfLayout(
  localSize: THREE.Vector3,
  localMin: THREE.Vector3,
  localMax: THREE.Vector3,
  params: GltfLayoutParams,
): GltfLayoutResult {
  const {
    footprint,
    scale = [1, 1, 1],
    yOffset = 0,
    uniformScale = false,
    fitExtent = 'xz',
    scaleMin,
    scaleMax,
  } = params;
  const [scaleX, scaleY, scaleZ] = scale;
  const extent = extentFromSize(localSize, fitExtent);
  const base = footprint / Math.max(extent, 0.001);

  let sx: number;
  let sy: number;
  let sz: number;

  if (uniformScale) {
    let s = base * scaleX;
    if (scaleMin != null) s = Math.max(s, scaleMin);
    if (scaleMax != null) s = Math.min(s, scaleMax);
    sx = sy = sz = s;
  } else {
    sx = base * scaleX;
    sy = (base * scaleY) / Math.max(localSize.y, 0.001);
    sz = base * scaleZ;
  }

  const posX = -((localMin.x + localMax.x) / 2) * sx;
  const posY = -localMin.y * sy + yOffset;
  const posZ = -((localMin.z + localMax.z) / 2) * sz;

  return {
    position: [posX, posY, posZ],
    modelScale: [sx, sy, sz],
    height: localSize.y * sy,
    localSize,
    localMin,
    localMax,
  };
}
