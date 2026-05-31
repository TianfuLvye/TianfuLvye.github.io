import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import {
  computeGltfLayout,
  measureSceneBounds,
} from '../lib/gltf-layout';

interface Props {
  url: string;
  footprint: number;
  scale?: [number, number, number];
  yOffset?: number;
  uniformScale?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

/** Invisible pick box sized from cached GLB bounds — no scene clone. */
export default function BuildingPickVolume({
  url,
  footprint,
  scale = [1, 1, 1],
  yOffset = 0,
  uniformScale = true,
  onClick,
  onDoubleClick,
  onPointerOver,
  onPointerOut,
}: Props) {
  const { scene } = useGLTF(url);

  const pick = useMemo(() => {
    const bounds = measureSceneBounds(scene);
    const layout = computeGltfLayout(
      bounds.localSize,
      bounds.localMin,
      bounds.localMax,
      { footprint, scale, yOffset, uniformScale },
    );
    const [sx, , sz] = layout.modelScale;
    return {
      centerY: layout.position[1] + layout.height / 2,
      size: [layout.localSize.x * sx, layout.height, layout.localSize.z * sz] as [
        number,
        number,
        number,
      ],
    };
  }, [scene, footprint, scale, yOffset, uniformScale]);

  return (
    <mesh
      position={[0, pick.centerY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.(e);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.(e);
      }}
    >
      <boxGeometry args={pick.size} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
