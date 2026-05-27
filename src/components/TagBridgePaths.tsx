import { useMemo } from 'react';
import * as THREE from 'three';
import { colorForTag } from '../lib/tag-bridges';
import type { BuildingPlacement } from '../lib/layout';
import { rngFor, rangeFrom } from '../lib/random';
import type { TagBridge } from '../lib/types';

const BASE_Y = 0.06;
const Y_LIFT = [0, 0.02, 0.04] as const;
const PLANK_COUNT = 10;

interface Props {
  bridges: TagBridge[];
  buildings: BuildingPlacement[];
}

interface PlankSpec {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  renderOrder: number;
}

function bridgeCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  rng: () => number,
): THREE.QuadraticBezierCurve3 {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len;
  const nz = dx / len;
  const bulge = 0.15 + rng() * 0.25;
  mid.y = BASE_Y + 0.04;
  mid.x += nx * bulge;
  mid.z += nz * bulge;
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

function plankColor(bridge: TagBridge, index: number, total: number): string {
  const { kind, tags } = bridge;
  if (kind === 'single') return colorForTag(tags[0]);
  if (kind === 'dual') {
    const half = total / 2;
    return index < half ? colorForTag(tags[0]) : colorForTag(tags[1]);
  }
  return colorForTag(tags[index % tags.length]);
}

function buildPlanks(
  bridge: TagBridge,
  start: THREE.Vector3,
  end: THREE.Vector3,
): PlankSpec[] {
  const rng = rngFor(`plank:${bridge.sourceId}:${bridge.targetId}`);
  const curve = bridgeCurve(start, end, rng);
  const yLift = Y_LIFT[bridge.priority - 1];
  const planks: PlankSpec[] = [];

  for (let i = 0; i < PLANK_COUNT; i++) {
    const t = (i + 0.5) / PLANK_COUNT;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const wobble = rangeFrom(rng, -0.04, 0.04);
    const width = 0.28 + rng() * 0.08;
    const length = 0.42 + rng() * 0.1;

    planks.push({
      position: [point.x, point.y + yLift, point.z],
      rotation: [0, yaw + wobble, rangeFrom(rng, -0.03, 0.03)],
      scale: [width, 0.05, length],
      color: plankColor(bridge, i, PLANK_COUNT),
      renderOrder: bridge.priority,
    });
  }

  return planks;
}

function TagBridge({ bridge, buildingsById }: {
  bridge: TagBridge;
  buildingsById: Map<string, BuildingPlacement>;
}) {
  const planks = useMemo(() => {
    const a = buildingsById.get(bridge.sourceId);
    const b = buildingsById.get(bridge.targetId);
    if (!a || !b) return [];

    const start = new THREE.Vector3(a.position[0], BASE_Y, a.position[2]);
    const end = new THREE.Vector3(b.position[0], BASE_Y, b.position[2]);
    return buildPlanks(bridge, start, end);
  }, [bridge, buildingsById]);

  if (planks.length === 0) return null;

  return (
    <group>
      {planks.map((plank, i) => (
        <mesh
          key={i}
          position={plank.position}
          rotation={plank.rotation}
          scale={plank.scale}
          renderOrder={plank.renderOrder}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={plank.color}
            roughness={0.92}
            metalness={0.02}
            depthWrite={plank.renderOrder === 1}
            polygonOffset
            polygonOffsetFactor={-plank.renderOrder}
            polygonOffsetUnits={-plank.renderOrder}
          />
        </mesh>
      ))}
    </group>
  );
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
