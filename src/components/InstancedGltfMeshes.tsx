import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { DecorFitExtent } from '../config/decoration-catalog';
import {
  computeGltfLayout,
  measureSceneBounds,
  type GltfLayoutParams,
} from '../lib/gltf-layout';

export interface GltfInstanceTransform {
  /** Stable id for per-instance hide (e.g. note id). */
  id?: string;
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
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Instances with matching id are collapsed (scale 0) without rebuilding groups. */
  hiddenIds?: ReadonlySet<string>;
  /** Per-instance Y offsets updated every frame (length = instances.length). */
  yOffsetsRef?: MutableRefObject<Float32Array | null>;
  /** Per-instance opacity 0–1 (length = instances.length). */
  opacityRef?: MutableRefObject<Float32Array | null>;
}

function createInstanceOpacityMaterial(material: THREE.Material): THREE.Material {
  const mat = material.clone();
  mat.transparent = true;
  mat.depthWrite = false;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'attribute float instanceOpacity;\nvarying float vInstanceOpacity;\n' +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvInstanceOpacity = instanceOpacity;',
    );
    shader.fragmentShader =
      'varying float vInstanceOpacity;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.a *= vInstanceOpacity;',
    );
  };
  mat.customProgramCacheKey = () => 'instanceOpacity';
  return mat;
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
  castShadow = false,
  receiveShadow = false,
  hiddenIds,
  yOffsetsRef,
  opacityRef,
}: {
  part: MeshPart;
  instances: GltfInstanceTransform[];
  layoutMatrix: THREE.Matrix4;
  castShadow?: boolean;
  receiveShadow?: boolean;
  hiddenIds?: ReadonlySet<string>;
  yOffsetsRef?: MutableRefObject<Float32Array | null>;
  opacityRef?: MutableRefObject<Float32Array | null>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const layoutReadyRef = useRef(false);
  const opacityMaterial = useMemo(
    () => (opacityRef ? createInstanceOpacityMaterial(part.material) : part.material),
    [part.material, opacityRef],
  );
  const instanceGeometry = useMemo(
    () => (opacityRef ? part.geometry.clone() : part.geometry),
    [part.geometry, opacityRef],
  );
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

  const writeInstanceMatrices = (yOffsets: Float32Array | null) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    temp.layoutPart.multiplyMatrices(layoutMatrix, part.localMatrix);

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      if (inst.id && hiddenIds?.has(inst.id)) {
        temp.matrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, temp.matrix);
        continue;
      }
      const s = inst.scale ?? 1;
      const yExtra = yOffsets?.[i] ?? 0;
      const opacity = opacityRef?.current?.[i] ?? 1;
      const visScale = s * Math.max(opacity, 0);
      if (opacityRef && opacity < 0.01) {
        temp.matrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, temp.matrix);
        continue;
      }
      temp.pos.set(
        inst.position[0],
        inst.position[1] + yExtra,
        inst.position[2],
      );
      temp.quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), inst.rotationY);
      temp.scale.set(visScale, visScale, visScale);
      temp.matrix.compose(temp.pos, temp.quat, temp.scale);
      temp.matrix.multiply(temp.layoutPart);
      mesh.setMatrixAt(i, temp.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = instances.length;
  };

  useLayoutEffect(() => {
    layoutReadyRef.current = false;
    const mesh = meshRef.current;
    if (mesh && opacityRef?.current) {
      mesh.geometry.setAttribute(
        'instanceOpacity',
        new THREE.InstancedBufferAttribute(opacityRef.current, 1),
      );
    }
    writeInstanceMatrices(yOffsetsRef?.current ?? null);
    layoutReadyRef.current = true;
  }, [instances, layoutMatrix, part, temp, hiddenIds, yOffsetsRef, opacityRef]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!layoutReadyRef.current || !mesh) return;

    if (opacityRef?.current) {
      const attr = mesh.geometry.getAttribute(
        'instanceOpacity',
      ) as THREE.InstancedBufferAttribute | undefined;
      if (attr) attr.needsUpdate = true;
    }

    if (opacityRef?.current || yOffsetsRef?.current) {
      writeInstanceMatrices(yOffsetsRef?.current ?? null);
    }
  });

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[instanceGeometry, opacityMaterial, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
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
  castShadow = false,
  receiveShadow = false,
  hiddenIds,
  yOffsetsRef,
  opacityRef,
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
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          hiddenIds={hiddenIds}
          yOffsetsRef={yOffsetsRef}
          opacityRef={opacityRef}
        />
      ))}
    </group>
  );
}
