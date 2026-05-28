import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
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
  type PlankSpec,
} from '../lib/plank-bridge';
import {
  bridgeKey,
  computeRiseEndMs,
  computeRiseSchedule,
  getBridgeRiseStartMs,
  plankId,
  riseYOffset,
  SINK_DURATION_MS,
  sinkYOffset,
  type TagBridgeAnimPhase,
} from '../lib/tag-bridge-animation';
import type { TagBridge } from '../lib/types';

interface Props {
  bridges: TagBridge[];
  buildings: BuildingPlacement[];
  visible: boolean;
}

interface AnimContextValue {
  phase: TagBridgeAnimPhase;
  riseSchedule: Map<string, number>;
  riseStartMs: number;
  sinkStartMs: number;
}

const TagBridgeAnimationContext = createContext<AnimContextValue | null>(null);

function useTagBridgeAnimation(): AnimContextValue {
  const ctx = useContext(TagBridgeAnimationContext);
  if (!ctx) throw new Error('TagBridgeAnimationContext missing');
  return ctx;
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

function useYOffsetRef(plankStartMs: number): MutableRefObject<number> {
  const { phase, riseStartMs, sinkStartMs } = useTagBridgeAnimation();
  const yRef = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (phase === 'hidden' || phase === 'shown') {
      yRef.current = 0;
      return;
    }
    if (phase === 'sinking') {
      yRef.current = sinkYOffset(now - sinkStartMs);
      return;
    }
    yRef.current = riseYOffset(now - riseStartMs, plankStartMs);
  });

  return yRef;
}

function AnimatedPlank({
  plank,
  index,
  bKey,
  renderOrder,
}: {
  plank: PlankSpec;
  index: number;
  bKey: string;
  renderOrder: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { riseSchedule } = useTagBridgeAnimation();
  const plankStartMs = riseSchedule.get(plankId(bKey, index)) ?? 0;
  const yOffsetRef = useYOffsetRef(plankStartMs);
  const restY = plank.position.y;

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(
      plank.position.x,
      restY + yOffsetRef.current,
      plank.position.z,
    );
  });

  return (
    <mesh
      ref={meshRef}
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
  );
}

function StringerSegment({
  a,
  b,
  color,
  baseY,
  renderOrder,
  yOffsetRef,
}: {
  a: THREE.Vector3;
  b: THREE.Vector3;
  color: string;
  baseY: number;
  renderOrder: number;
  yOffsetRef: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mid = useMemo(
    () => a.clone().add(b).multiplyScalar(0.5),
    [a, b],
  );
  const len = useMemo(() => a.distanceTo(b), [a, b]);
  const yaw = useMemo(() => Math.atan2(b.x - a.x, b.z - a.z), [a, b]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.y = baseY + yOffsetRef.current;
  });

  return (
    <mesh
      ref={meshRef}
      position={[mid.x, baseY, mid.z]}
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
}

function StringerMesh({
  points,
  color,
  yLift,
  renderOrder,
  yOffsetRef,
}: {
  points: THREE.Vector3[];
  color: string;
  yLift: number;
  renderOrder: number;
  yOffsetRef: MutableRefObject<number>;
}) {
  const baseY = BASE_Y + 0.02 + yLift;

  return (
    <group>
      {points.slice(0, -1).map((a, i) => (
        <StringerSegment
          key={i}
          a={a}
          b={points[i + 1]}
          color={color}
          baseY={baseY}
          renderOrder={renderOrder}
          yOffsetRef={yOffsetRef}
        />
      ))}
    </group>
  );
}

function AnimatedPiling({
  position,
  height,
  renderOrder,
  yOffsetRef,
}: {
  position: [number, number, number];
  height: number;
  renderOrder: number;
  yOffsetRef: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const restY = position[1] + height / 2;

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.y = restY + yOffsetRef.current;
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], restY, position[2]]}
      renderOrder={renderOrder}
    >
      <boxGeometry args={[0.1, height, 0.1]} />
      <meshStandardMaterial color={WOOD_DARK} roughness={1} />
    </mesh>
  );
}

function AnimatedRailing({
  points,
  renderOrder,
  yOffsetRef,
}: {
  points: THREE.Vector3[];
  renderOrder: number;
  yOffsetRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.y = yOffsetRef.current;
  });

  return (
    <group ref={groupRef}>
      <Line
        points={points}
        color={ROPE_COLOR}
        lineWidth={1}
        renderOrder={renderOrder}
      />
    </group>
  );
}

function TagBridgeMesh({
  spec,
  bKey,
}: {
  spec: BridgeMeshSpec;
  bKey: string;
}) {
  const { renderOrder, yLift, planks } = spec;
  const { riseSchedule } = useTagBridgeAnimation();
  const bridgeRiseStartMs = useMemo(
    () => getBridgeRiseStartMs(bKey, planks.length, riseSchedule),
    [bKey, planks.length, riseSchedule],
  );
  const yOffsetRef = useYOffsetRef(bridgeRiseStartMs);

  return (
    <group>
      {spec.pilings.map((p, i) => (
        <AnimatedPiling
          key={`p-${i}`}
          position={p.position}
          height={p.height}
          renderOrder={renderOrder}
          yOffsetRef={yOffsetRef}
        />
      ))}

      {spec.stringers.map((s, i) => (
        <StringerMesh
          key={`s-${i}`}
          points={s.points}
          color={s.color}
          yLift={yLift}
          renderOrder={renderOrder}
          yOffsetRef={yOffsetRef}
        />
      ))}

      {spec.planks.map((plank, i) => (
        <AnimatedPlank
          key={`pl-${i}`}
          plank={plank}
          index={i}
          bKey={bKey}
          renderOrder={renderOrder}
        />
      ))}

      {spec.railingSegments.map((seg, i) => (
        <AnimatedRailing
          key={`r-${i}`}
          points={seg.points}
          renderOrder={renderOrder + 1}
          yOffsetRef={yOffsetRef}
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
  const bKey = bridgeKey(bridge);
  const spec = useMemo(() => {
    const a = buildingsById.get(bridge.sourceId);
    const b = buildingsById.get(bridge.targetId);
    if (!a || !b) return null;

    const start = new THREE.Vector3(a.position[0], BASE_Y, a.position[2]);
    const end = new THREE.Vector3(b.position[0], BASE_Y, b.position[2]);
    return buildBridgeMeshSpec(bridge, start, end);
  }, [bridge, buildingsById]);

  if (!spec) return null;
  return <TagBridgeMesh spec={spec} bKey={bKey} />;
}

export default function TagBridgePaths({ bridges, buildings, visible }: Props) {
  const buildingsById = useMemo(() => {
    const m = new Map<string, BuildingPlacement>();
    for (const b of buildings) m.set(b.note.id, b);
    return m;
  }, [buildings]);

  const positions = useMemo(() => {
    const m = new Map<string, readonly [number, number, number]>();
    for (const b of buildings) m.set(b.note.id, b.position);
    return m;
  }, [buildings]);

  const ordered = useMemo(
    () => [...bridges].sort((a, b) => a.priority - b.priority),
    [bridges],
  );

  const [phase, setPhase] = useState<TagBridgeAnimPhase>('hidden');
  const [riseSchedule, setRiseSchedule] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [riseStartMs, setRiseStartMs] = useState(0);
  const [sinkStartMs, setSinkStartMs] = useState(0);
  const [hasActivated, setHasActivated] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (visible) {
      setHasActivated(true);
      const schedule = computeRiseSchedule(bridges, positions);
      setRiseSchedule(schedule);
      setRiseStartMs(performance.now());
      setPhase('rising');
      return;
    }

    if (phaseRef.current === 'rising' || phaseRef.current === 'shown') {
      setSinkStartMs(performance.now());
      setPhase('sinking');
    }
  }, [visible, bridges, positions]);

  useFrame(() => {
    const now = performance.now();
    if (phaseRef.current === 'rising') {
      const endMs = computeRiseEndMs(riseSchedule);
      if (endMs === 0 || now - riseStartMs >= endMs) {
        setPhase('shown');
      }
    }
    if (phaseRef.current === 'sinking' && now - sinkStartMs >= SINK_DURATION_MS) {
      setPhase('hidden');
    }
  });

  const animValue = useMemo<AnimContextValue>(
    () => ({
      phase,
      riseSchedule,
      riseStartMs,
      sinkStartMs,
    }),
    [phase, riseSchedule, riseStartMs, sinkStartMs],
  );

  if (!hasActivated && phase === 'hidden') return null;
  if (phase === 'hidden') return null;

  return (
    <TagBridgeAnimationContext.Provider value={animValue}>
      <group>
        {ordered.map((bridge) => (
          <TagBridge
            key={`${bridge.sourceId}:${bridge.targetId}`}
            bridge={bridge}
            buildingsById={buildingsById}
          />
        ))}
      </group>
    </TagBridgeAnimationContext.Provider>
  );
}
