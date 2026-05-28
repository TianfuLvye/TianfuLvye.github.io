import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { DecorFitExtent } from '../config/decoration-catalog';

export interface GlTFModelProps {
  url: string;
  footprint: number;
  scale?: [number, number, number];
  yOffset?: number;
  emphasized?: boolean;
  /** Decorations: equal X/Y/Z scale. Buildings: Y follows scale[1] / bbox height. */
  uniformScale?: boolean;
  fitExtent?: DecorFitExtent;
  scaleMin?: number;
  scaleMax?: number;
}

function applyEmissive(root: THREE.Object3D, emphasized: boolean) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const mat of mats) {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.emissive.set(emphasized ? '#c9a961' : '#000000');
        mat.emissiveIntensity = emphasized ? 0.22 : 0;
      }
    }
  });
}

function extentFromSize(
  size: THREE.Vector3,
  fitExtent: DecorFitExtent,
): number {
  if (fitExtent === 'y') return size.y;
  if (fitExtent === 'max') return Math.max(size.x, size.y, size.z);
  return Math.max(size.x, size.z);
}

export default function GlTFModel({
  url,
  footprint,
  scale = [1, 1, 1],
  yOffset = 0,
  emphasized = false,
  uniformScale = false,
  fitExtent = 'xz',
  scaleMin,
  scaleMax,
}: GlTFModelProps) {
  const { scene } = useGLTF(url);
  const scaleX = scale[0];
  const scaleY = scale[1];
  const scaleZ = scale[2];

  /** Bbox from a fresh local-space clone — never re-measure after parent scale is applied. */
  const { clone, localSize, localMinY } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(c);
    return {
      clone: c,
      localSize: box.getSize(new THREE.Vector3()),
      localMinY: box.min.y,
    };
  }, [scene]);

  const layout = useMemo(() => {
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

    const posY = -localMinY * sy + yOffset;

    return {
      position: [0, posY, 0] as [number, number, number],
      modelScale: [sx, sy, sz] as [number, number, number],
      height: localSize.y * sy,
    };
  }, [
    localSize,
    localMinY,
    footprint,
    scaleX,
    scaleY,
    scaleZ,
    yOffset,
    uniformScale,
    fitExtent,
    scaleMin,
    scaleMax,
  ]);

  useEffect(() => {
    applyEmissive(clone, emphasized);
  }, [clone, emphasized]);

  return (
    <group position={layout.position} scale={layout.modelScale}>
      <primitive object={clone} />
    </group>
  );
}

export function preloadGltfUrls(urls: string[]) {
  const unique = [...new Set(urls)];
  for (const url of unique) {
    useGLTF.preload(url);
  }
}
