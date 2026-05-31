import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { DecorFitExtent } from '../config/decoration-catalog';
import { computeGltfLayout, measureSceneBounds } from '../lib/gltf-layout';

export interface GlTFModelProps {
  url: string;
  footprint: number;
  scale?: [number, number, number];
  yOffset?: number;
  /** Deep-clone materials so per-instance emissive/tint is isolated (buildings). */
  cloneMaterials?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
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
  /** When false, only the pick volume is rendered (instanced visual elsewhere). */
  renderModel?: boolean;
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

function cloneScene(
  scene: THREE.Object3D,
  cloneMaterials: boolean,
  castShadow: boolean,
  receiveShadow: boolean,
): THREE.Object3D {
  const root = scene.clone(true);
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = castShadow;
    child.receiveShadow = receiveShadow;
    if (!cloneMaterials) return;
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

function disposeClonedMaterials(root: THREE.Object3D) {
  const disposed = new Set<THREE.Material>();
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const mat of mats) {
      if (mat && !disposed.has(mat)) {
        disposed.add(mat);
        mat.dispose();
      }
    }
  });
}

export default function GlTFModel({
  url,
  footprint,
  scale = [1, 1, 1],
  yOffset = 0,
  cloneMaterials = true,
  castShadow = true,
  receiveShadow = true,
  emphasized = false,
  tintColor,
  emissiveIntensity = 0.1,
  uniformScale = false,
  fitExtent = 'xz',
  scaleMin,
  scaleMax,
  renderModel = true,
  interactive = false,
  onClick,
  onDoubleClick,
  onPointerOver,
  onPointerOut,
}: GlTFModelProps) {
  const { scene } = useGLTF(url);

  const { clone, layout } = useMemo(() => {
    const c = cloneScene(scene, cloneMaterials, castShadow, receiveShadow);
    const bounds = measureSceneBounds(c);
    const layoutResult = computeGltfLayout(
      bounds.localSize,
      bounds.localMin,
      bounds.localMax,
      {
        footprint,
        scale,
        yOffset,
        uniformScale,
        fitExtent,
        scaleMin,
        scaleMax,
      },
    );
    return { clone: c, layout: layoutResult };
  }, [
    scene,
    cloneMaterials,
    castShadow,
    receiveShadow,
    footprint,
    scale,
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
    if (!cloneMaterials) return;
    return () => disposeClonedMaterials(clone);
  }, [clone, cloneMaterials]);

  useEffect(() => {
    if (!renderModel || !cloneMaterials) return;
    if (tintColor) {
      applyTint(clone, tintColor, emissiveIntensity);
    } else {
      applyEmissive(clone, emphasized);
    }
  }, [
    clone,
    emphasized,
    tintColor,
    emissiveIntensity,
    renderModel,
    cloneMaterials,
  ]);

  const [sx, sy, sz] = layout.modelScale;
  const pickCenterY = layout.position[1] + layout.height / 2;
  const pickSize: [number, number, number] = [
    layout.localSize.x * sx,
    layout.height,
    layout.localSize.z * sz,
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
      {renderModel && (
        <group position={layout.position} scale={layout.modelScale}>
          <primitive object={clone} />
        </group>
      )}
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
