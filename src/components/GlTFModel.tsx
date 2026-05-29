import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { DecorFitExtent } from '../config/decoration-catalog';

export interface GlTFModelProps {
  url: string;
  footprint: number;
  scale?: [number, number, number];
  yOffset?: number;
  emphasized?: boolean;
  /** Tint mesh color (roads, etc.). */
  tintColor?: string;
  /** Emissive intensity when tintColor is set. */
  emissiveIntensity?: number;
  /** Decorations: equal X/Y/Z scale. Buildings: Y follows scale[1] / bbox height. */
  uniformScale?: boolean;
  fitExtent?: DecorFitExtent;
  scaleMin?: number;
  scaleMax?: number;
  /** Single invisible pick volume; visual meshes do not raycast. */
  interactive?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
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

function applyTint(
  root: THREE.Object3D,
  tintColor: string | undefined,
  emissiveIntensity: number,
) {
  if (!tintColor) return;
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const mat of mats) {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.color.set(tintColor);
        mat.emissive.set(tintColor);
        mat.emissiveIntensity = emissiveIntensity;
      }
    }
  });
}

/** Deep-clone scene nodes; give each mesh its own materials (useGLTF cache shares them). */
function cloneSceneWithMaterials(scene: THREE.Object3D): THREE.Object3D {
  const root = scene.clone(true);
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => m.clone());
    } else if (child.material) {
      child.material = child.material.clone();
    }
  });
  return root;
}

function disableVisualRaycast(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.raycast = () => null;
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
  tintColor,
  emissiveIntensity = 0.1,
  uniformScale = false,
  fitExtent = 'xz',
  scaleMin,
  scaleMax,
  interactive = false,
  onClick,
  onDoubleClick,
  onPointerOver,
  onPointerOut,
}: GlTFModelProps) {
  const { scene } = useGLTF(url);
  const scaleX = scale[0];
  const scaleY = scale[1];
  const scaleZ = scale[2];

  /** Bbox from a fresh local-space clone — never re-measure after parent scale is applied. */
  const { clone, localSize, localMin, localMax } = useMemo(() => {
    const c = cloneSceneWithMaterials(scene);
    const box = new THREE.Box3().setFromObject(c);
    return {
      clone: c,
      localSize: box.getSize(new THREE.Vector3()),
      localMin: box.min.clone(),
      localMax: box.max.clone(),
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

    const posX = -((localMin.x + localMax.x) / 2) * sx;
    const posY = -localMin.y * sy + yOffset;
    const posZ = -((localMin.z + localMax.z) / 2) * sz;

    return {
      position: [posX, posY, posZ] as [number, number, number],
      modelScale: [sx, sy, sz] as [number, number, number],
      height: localSize.y * sy,
    };
  }, [
    localSize,
    localMin,
    localMax,
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

  useLayoutEffect(() => {
    if (!interactive) return;
    disableVisualRaycast(clone);
  }, [clone, interactive]);

  useEffect(() => {
    if (tintColor) {
      applyTint(clone, tintColor, emissiveIntensity);
    } else {
      applyEmissive(clone, emphasized);
    }
  }, [clone, emphasized, tintColor, emissiveIntensity]);

  const [sx, sy, sz] = layout.modelScale;
  const pickCenterY = layout.position[1] + layout.height / 2;
  const pickSize: [number, number, number] = [
    localSize.x * sx,
    layout.height,
    localSize.z * sz,
  ];

  const pickHandlers = interactive
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick?.(e);
        },
        onDoubleClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onDoubleClick?.(e);
        },
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onPointerOver?.(e);
        },
        onPointerOut: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onPointerOut?.(e);
        },
      }
    : {};

  return (
    <group>
      <group position={layout.position} scale={layout.modelScale}>
        <primitive object={clone} />
      </group>
      {interactive && (
        <mesh position={[0, pickCenterY, 0]} {...pickHandlers}>
          <boxGeometry args={pickSize} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  );
}

export function preloadGltfUrls(urls: string[]) {
  const unique = [...new Set(urls)];
  for (const url of unique) {
    useGLTF.preload(url);
  }
}
