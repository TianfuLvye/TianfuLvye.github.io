import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { DecorFitExtent } from '../config/decoration-catalog';
import {
  computeGltfLayout,
  measureSceneBounds,
  type GltfLayoutParams,
} from '../lib/gltf-layout';

export interface GltfInstanceTransform {
  position: [number, number, number];
  rotationY: number;
  /** Uniform multiplier on top of normalized layout scale. */
  scale?: number;
}

interface MeshPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  localMatrix: THREE.Matrix4;
}

interface Props extends GltfLayoutParams {
  url: string;
  instances: GltfInstanceTransform[];
}

function collectMeshParts(scene: THREE.Object3D): MeshPart[] {
  scene.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  const parts: MeshPart[] = [];

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const localMatrix = new THREE.Matrix4().multiplyMatrices(
      invRoot,
      child.matrixWorld,
    );
    const material = Array.isArray(child.material)
      ? child.material[0]
      : child.material;
    parts.push({
      geometry: child.geometry,
      material,
      localMatrix,
    });
  });

  return parts;
}

function InstancedMeshPart({
  part,
  instances,
  layoutMatrix,
}: {
  part: MeshPart;
  instances: GltfInstanceTransform[];
  layoutMatrix: THREE.Matrix4;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const temp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      layoutPart: new THREE.Matrix4(),
    }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    temp.layoutPart.multiplyMatrices(layoutMatrix, part.localMatrix);

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const s = inst.scale ?? 1;
      temp.pos.set(inst.position[0], inst.position[1], inst.position[2]);
      temp.quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), inst.rotationY);
      temp.scale.set(s, s, s);
      temp.matrix.compose(temp.pos, temp.quat, temp.scale);
      temp.matrix.multiply(temp.layoutPart);
      mesh.setMatrixAt(i, temp.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = instances.length;
  }, [instances, layoutMatrix, part, temp]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[part.geometry, part.material, instances.length]}
      castShadow={false}
      receiveShadow={false}
      frustumCulled={false}
    />
  );
}

export default function InstancedGltfMeshes({
  url,
  footprint,
  instances,
  scale = [1, 1, 1],
  yOffset = 0,
  uniformScale = false,
  fitExtent = 'xz' as DecorFitExtent,
  scaleMin,
  scaleMax,
}: Props) {
  const { scene } = useGLTF(url);

  const { parts, layoutMatrix } = useMemo(() => {
    const bounds = measureSceneBounds(scene);
    const layout = computeGltfLayout(
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
    const layoutMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...layout.position),
      new THREE.Quaternion(),
      new THREE.Vector3(...layout.modelScale),
    );
    return {
      parts: collectMeshParts(scene),
      layoutMatrix,
    };
  }, [
    scene,
    footprint,
    scale,
    yOffset,
    uniformScale,
    fitExtent,
    scaleMin,
    scaleMax,
  ]);

  if (instances.length === 0 || parts.length === 0) return null;

  return (
    <group>
      {parts.map((part, index) => (
        <InstancedMeshPart
          key={`${url}-${index}`}
          part={part}
          instances={instances}
          layoutMatrix={layoutMatrix}
        />
      ))}
    </group>
  );
}
