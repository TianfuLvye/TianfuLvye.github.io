import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingPlacement } from '../lib/layout';
import {
  BASE_Y,
  buildBridgeMeshSpec,
  buildPlankGeometry,
  ROPE_COLOR,
  WOOD_DARK,
  type BridgeMeshSpec,
} from '../lib/plank-bridge';
import type { TagBridge } from '../lib/types';

interface Props {
  bridges: TagBridge[];
  buildings: BuildingPlacement[];
}

const geometryCache = new Map<string, THREE.BufferGeometry>();

function getPlankGeometry(seed: string): THREE.BufferGeometry {
  let geo = geometryCache.get(seed);
  if (!geo) {
    geo = buildPlankGeometry(seed);
    geometryCache.set(seed, geo);
  }
  return geo;
}

function StringerMesh({
  points,
  color,
  yLift,
  renderOrder,
}: {
  points: THREE.Vector3[];
  color: string;
  yLift: number;
  renderOrder: number;
}) {
  const y = BASE_Y + 0.02 + yLift;
  return (
    <group>
      {points.slice(0, -1).map((a, i) => {
        const b = points[i + 1];
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const len = a.distanceTo(b);
        const yaw = Math.atan2(b.x - a.x, b.z - a.z);
        return (
          <mesh
            key={i}
            position={[mid.x, y, mid.z]}
            rotation={[0, yaw, 0]}
            renderOrder={renderOrder}
          >
            <boxGeometry args={[0.09, 0.07, len * 1.02]} />
            <meshStandardMaterial
              color={color}
              roughness={0.95}
              metalness={0.01}
              polygonOffset
              polygonOffsetFactor={-renderOrder}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function TagBridgeMesh({ spec }: { spec: BridgeMeshSpec }) {
  const { renderOrder, yLift } = spec;

  return (
    <group>
      {spec.pilings.map((p, i) => (
        <mesh
          key={`p-${i}`}
          position={[p.position[0], p.position[1] + p.height / 2, p.position[2]]}
          renderOrder={renderOrder}
        >
          <boxGeometry args={[0.1, p.height, 0.1]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={1} />
        </mesh>
      ))}

      {spec.stringers.map((s, i) => (
        <StringerMesh
          key={`s-${i}`}
          points={s.points}
          color={s.color}
          yLift={yLift}
          renderOrder={renderOrder}
        />
      ))}

      {spec.planks.map((plank, i) => (
        <mesh
          key={`pl-${i}`}
          position={plank.position}
          rotation={plank.rotation}
          geometry={getPlankGeometry(plank.geometrySeed)}
          renderOrder={renderOrder}
        >
          <meshStandardMaterial
            color={plank.color}
            roughness={0.92}
            metalness={0.02}
            depthWrite={renderOrder === 1}
            polygonOffset
            polygonOffsetFactor={-renderOrder}
            polygonOffsetUnits={-renderOrder}
          />
        </mesh>
      ))}

      {spec.railingSegments.map((seg, i) => (
        <Line
          key={`r-${i}`}
          points={seg.points}
          color={ROPE_COLOR}
          lineWidth={1}
          renderOrder={renderOrder + 1}
        />
      ))}
    </group>
  );
}

function TagBridge({
  bridge,
  buildingsById,
}: {
  bridge: TagBridge;
  buildingsById: Map<string, BuildingPlacement>;
}) {
  const spec = useMemo(() => {
    const a = buildingsById.get(bridge.sourceId);
    const b = buildingsById.get(bridge.targetId);
    if (!a || !b) return null;

    const start = new THREE.Vector3(a.position[0], BASE_Y, a.position[2]);
    const end = new THREE.Vector3(b.position[0], BASE_Y, b.position[2]);
    return buildBridgeMeshSpec(bridge, start, end);
  }, [bridge, buildingsById]);

  if (!spec) return null;
  return <TagBridgeMesh spec={spec} />;
}

export default function TagBridgePaths({ bridges, buildings }: Props) {
  const buildingsById = useMemo(() => {
    const m = new Map<string, BuildingPlacement>();
    for (const b of buildings) m.set(b.note.id, b);
    return m;
  }, [buildings]);

  const ordered = useMemo(
    () => [...bridges].sort((a, b) => a.priority - b.priority),
    [bridges],
  );

  return (
    <group>
      {ordered.map((bridge) => (
        <TagBridge
          key={`${bridge.sourceId}:${bridge.targetId}`}
          bridge={bridge}
          buildingsById={buildingsById}
        />
      ))}
    </group>
  );
}
